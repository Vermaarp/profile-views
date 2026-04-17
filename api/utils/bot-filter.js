const BOT_PATTERNS = [/bot/i,/crawler/i,/spider/i,/curl/i,/wget/i,/python/i,/Go-http/i,/PostmanRuntime/i,/axios/i,/node-fetch/i];
export function isBot(ua) {
  if (!ua || ua.length < 10) return true;
  return BOT_PATTERNS.some(p => p.test(ua));
}
