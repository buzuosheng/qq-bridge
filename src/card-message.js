/**
 * 把 OneBot 的 json / xml / share / music / location / contact 段
 * 转成可以喂给模型的短摘要（标题、来源、摘要、跳转链接）。
 * 不把原始 JSON 整段送进提示词。字段来自用户或第三方，必须净化并限长。
 */
import { truncateText } from './md-to-plain.js';
import { sanitizeUntrustedText } from './qq-model-view.js';

export const CARD_FALLBACK = '[卡片消息]';
const MAX_LABEL = 200;
const MAX_FIELD = 80;
const MAX_URL = 120;

function cleanField(value, max = MAX_FIELD) {
  const s = sanitizeUntrustedText(value).replace(/\s+/g, ' ').trim();
  return s ? truncateText(s, max) : '';
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(String(value ?? '').trim());
}

function cleanUrl(value) {
  const s = sanitizeUntrustedText(value).replace(/\s+/g, '').trim();
  return looksLikeUrl(s) ? truncateText(s, MAX_URL) : '';
}

function unescapeCq(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&#44;|&comma;/gi, ',')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const text = unescapeCq(raw).trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function firstString(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const s = String(value).trim();
      if (s) return s;
    }
  }
  return '';
}

function metaBuckets(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return [];
  return Object.values(meta).filter((value) => value && typeof value === 'object' && !Array.isArray(value));
}

function firstInBuckets(buckets, keys) {
  for (const bucket of buckets) {
    const s = firstString(bucket, keys);
    if (s) return s;
  }
  return '';
}

const TITLE_KEYS = ['title', 'tit', 'name', 'song', 'video'];
const DESC_KEYS = ['desc', 'description', 'summary', 'content', 'subtitle'];
const URL_KEYS = ['qqdocurl', 'jumpUrl', 'jump_url', 'jumptourl', 'jumpURL', 'url'];
const SOURCE_KEYS = ['tag', 'tagName', 'source_name', 'sourcename', 'host', 'appName', 'appname'];

const APP_SOURCE = {
  'com.tencent.music.lua': '音乐',
  'com.tencent.mannounce': '群公告',
  'com.tencent.troopsharecard': '群分享',
  'com.tencent.channel': '频道',
  'com.tencent.qzone.photo': '相册'
};

function inferSource(app, topDesc, buckets, title) {
  const tagged = firstInBuckets(buckets, SOURCE_KEYS);
  if (tagged && tagged !== title && !looksLikeUrl(tagged) && tagged.length <= 20) return tagged;
  if (app && APP_SOURCE[app]) return APP_SOURCE[app];
  if (typeof app === 'string' && app.includes('miniapp') && topDesc && topDesc !== title && topDesc.length <= 20) {
    return topDesc;
  }
  if (topDesc && topDesc !== title && !String(topDesc).startsWith('[') && topDesc.length <= 16) {
    return topDesc;
  }
  return '';
}

export function parseJsonCard(data) {
  const raw = data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'data')
    ? data.data
    : data;
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const app = firstString(obj, ['app']);
  const prompt = firstString(obj, ['prompt']);
  const topDesc = firstString(obj, ['desc']);
  const buckets = metaBuckets(obj.meta);
  const title = firstInBuckets(buckets, TITLE_KEYS) || prompt || topDesc;
  let desc = firstInBuckets(buckets, DESC_KEYS);
  if (desc === title) desc = '';
  const source = inferSource(app, topDesc, buckets, title);
  if (!desc && topDesc && topDesc !== title && topDesc !== source) desc = topDesc;
  if (desc === source) desc = '';
  return {
    app,
    source,
    title,
    desc,
    url: firstInBuckets(buckets, URL_KEYS)
  };
}

export function formatCardLabel({ source = '', title = '', desc = '', url = '' } = {}, fallback = CARD_FALLBACK) {
  const src = cleanField(source, 20);
  const ttl = cleanField(title, MAX_FIELD);
  const summary = cleanField(desc, MAX_FIELD);
  const link = cleanUrl(url);
  const chunks = [];
  if (src && ttl && src !== ttl) chunks.push(`${src}：${ttl}`);
  else if (ttl) chunks.push(ttl);
  else if (src) chunks.push(src);
  if (summary && summary !== src && summary !== ttl) chunks.push(summary);
  if (link) chunks.push(link);
  if (chunks.length === 0) return fallback;
  return truncateText(`[卡片] ${chunks.join(' ')}`, MAX_LABEL);
}

function xmlText(raw, tag) {
  const match = unescapeCq(raw).match(new RegExp(`<${tag}[^>]*>([^<]*)`, 'i'));
  return match ? match[1].trim() : '';
}

function xmlAttr(raw, attr) {
  const match = unescapeCq(raw).match(new RegExp(`${attr}="([^"]*)"`, 'i'));
  return match ? match[1].trim() : '';
}

function xmlSource(raw) {
  const match = unescapeCq(raw).match(/<source[^>]*\bname="([^"]*)"/i);
  return match ? match[1].trim() : '';
}

export function describeCardSegment(seg) {
  if (!seg || typeof seg !== 'object') return '';
  const type = String(seg.type ?? '');
  const data = seg.data && typeof seg.data === 'object' ? seg.data : {};
  if (type === 'json') {
    const parsed = parseJsonCard(data);
    return parsed ? formatCardLabel(parsed) : CARD_FALLBACK;
  }
  if (type === 'xml') {
    const raw = typeof data.data === 'string' ? data.data : (typeof data.xml === 'string' ? data.xml : '');
    return formatCardLabel({
      source: xmlSource(raw) || xmlAttr(raw, 'brief'),
      title: xmlText(raw, 'title'),
      url: xmlAttr(raw, 'url') || xmlAttr(raw, 'jumpUrl')
    });
  }
  if (type === 'share') {
    return formatCardLabel({
      source: '分享',
      title: data.title,
      desc: data.content,
      url: data.url
    });
  }
  if (type === 'music') {
    return formatCardLabel({
      source: '音乐',
      title: data.title,
      desc: data.content,
      url: data.url || data.jumpUrl
    });
  }
  if (type === 'location') {
    const title = data.title || '位置';
    const desc = data.content || [data.lat, data.lon].filter((value) => value != null && value !== '').join(', ');
    return formatCardLabel({ source: '位置', title, desc });
  }
  if (type === 'contact') {
    const kind = String(data.type ?? '') === 'group' ? '群名片' : '名片';
    const id = data.id != null ? String(data.id) : '';
    return formatCardLabel({ source: kind, title: id || kind });
  }
  return '';
}
