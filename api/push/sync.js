import { Redis } from '@upstash/redis';
import { timingSafeEqual } from 'node:crypto';

const jsonError = (response, status, error) => response.status(status).json({ error });
const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9-]{16,80}$/.test(value);

const tokenMatches = (provided, stored) => {
  if (typeof provided !== 'string' || typeof stored !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(request, response) {
  if (request.method !== 'POST') return jsonError(response, 405, 'Use POST.');
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return jsonError(response, 503, 'Push storage is not configured yet.');
  }

  const { deviceId, deviceToken, subscription, items, enabled = true } = request.body || {};
  if (!validId(deviceId) || typeof deviceToken !== 'string' || deviceToken.length < 32) {
    return jsonError(response, 400, 'Invalid device credentials.');
  }
  if (!Array.isArray(items) || items.length > 500) return jsonError(response, 400, 'Invalid reminder list.');
  if (enabled && (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)) {
    return jsonError(response, 400, 'A valid push subscription is required.');
  }
  const now = Date.now();
  const cleanItems = [];
  for (const item of items) {
    if (!item || typeof item.key !== 'string' || item.key.length > 120 || typeof item.title !== 'string' || !Number.isFinite(item.dueAt)) {
      return jsonError(response, 400, 'Invalid reminder item.');
    }
    if (item.dueAt <= now || item.dueAt > now + 366 * 24 * 60 * 60 * 1000) continue;
    cleanItems.push({
      key: item.key,
      title: item.title.slice(0, 200),
      dueAt: item.dueAt,
      url: item.url === '/schedules' ? '/schedules' : '/todos',
    });
  }

  try {
    const redis = Redis.fromEnv();
    const deviceKey = `push:device:${deviceId}`;
    const device = await redis.get(deviceKey);
    if (device && !tokenMatches(deviceToken, device.token)) return jsonError(response, 403, 'Device credentials do not match.');

    if (!enabled) {
      const oldIds = await redis.smembers(`push:device-items:${deviceId}`);
      const pipeline = redis.pipeline();
      oldIds.forEach((id) => {
        pipeline.zrem('push:due', id);
        pipeline.del(`push:item:${id}`);
      });
      pipeline.del(`push:device-items:${deviceId}`);
      pipeline.del(deviceKey);
      await pipeline.exec();
      return response.status(200).json({ ok: true, disabled: true });
    }

    const oldIds = await redis.smembers(`push:device-items:${deviceId}`);
    const nextIds = cleanItems.map((item) => `${deviceId}:${item.key}`);
    const nextSet = new Set(nextIds);
    const pipeline = redis.pipeline();
    oldIds.filter((id) => !nextSet.has(id)).forEach((id) => {
      pipeline.zrem('push:due', id);
      pipeline.del(`push:item:${id}`);
    });
    pipeline.set(deviceKey, { token: deviceToken, subscription });
    pipeline.del(`push:device-items:${deviceId}`);
    if (nextIds.length) pipeline.sadd(`push:device-items:${deviceId}`, ...nextIds);
    cleanItems.forEach((item, index) => {
      const id = nextIds[index];
      pipeline.set(`push:item:${id}`, { deviceId, item });
      pipeline.zadd('push:due', { score: item.dueAt, member: id });
    });
    await pipeline.exec();
    return response.status(200).json({ ok: true, reminders: cleanItems.length });
  } catch (error) {
    console.error('Push reminder sync failed:', error);
    return jsonError(response, 500, 'Could not save push reminders.');
  }
}
