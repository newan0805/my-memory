import { Redis } from '@upstash/redis';
import { Client as QStash } from '@upstash/qstash';
import webPush from 'web-push';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).send('Use POST.');
  if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).send('Unauthorized.');
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return response.status(503).send('Push delivery is not configured.');
  }

  try {
    const redis = Redis.fromEnv();
    webPush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const ids = await redis.zrange('push:due', '-inf', Date.now(), { byScore: true, offset: 0, count: 100 });
    let sent = 0;
    let removed = 0;

    for (const id of ids) {
      const record = await redis.get(`push:item:${id}`);
      if (!record) {
        await redis.zrem('push:due', id);
        removed += 1;
        continue;
      }
      const device = await redis.get(`push:device:${record.deviceId}`);
      if (!device?.subscription) {
        await redis.zrem('push:due', id);
        await redis.del(`push:item:${id}`);
        await redis.srem(`push:device-items:${record.deviceId}`, id);
        removed += 1;
        continue;
      }

      try {
        await webPush.sendNotification(device.subscription, JSON.stringify({
          title: 'My Memory reminder',
          body: `It's time for: ${record.item.title}`,
          url: record.item.url,
          tag: id,
        }), { TTL: 3600, urgency: 'high' });
        await redis.zrem('push:due', id);
        await redis.del(`push:item:${id}`);
        await redis.srem(`push:device-items:${record.deviceId}`, id);
        sent += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await redis.del(`push:device:${record.deviceId}`);
          const deviceIds = await redis.smembers(`push:device-items:${record.deviceId}`);
          const cleanup = redis.pipeline();
          deviceIds.forEach((deviceItemId) => {
            cleanup.zrem('push:due', deviceItemId);
            cleanup.del(`push:item:${deviceItemId}`);
          });
          cleanup.del(`push:device-items:${record.deviceId}`);
          await cleanup.exec();
          removed += 1;
        } else {
          console.error('Push delivery failed:', error.statusCode || error.message);
        }
      }
    }

    if (await redis.zcard('push:due') === 0 && process.env.QSTASH_TOKEN) {
      await new QStash({ token: process.env.QSTASH_TOKEN }).schedules.delete('my-memory-push-dispatch').catch(() => {});
    }

    return response.status(200).json({ ok: true, sent, removed, checked: ids.length });
  } catch (error) {
    console.error('Push cron failed:', error);
    return response.status(500).send('Push delivery failed.');
  }
}
