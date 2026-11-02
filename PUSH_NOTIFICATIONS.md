# Background push notifications

The app keeps tasks and schedules on each device. When background push is enabled, it sends the device's push subscription and the due reminder details to the Vercel API. Upstash Redis stores those pending reminders; the scheduled function sends them through Web Push when they are due.

## Vercel environment variables

Connect an Upstash Redis database to the Vercel project. The integration supplies:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_TOKEN`

Generate a VAPID key pair with `npx web-push generate-vapid-keys --json`, then add:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (for example, `mailto:admin@example.com`)
- `CRON_SECRET` (a random secret of at least 32 characters)

Set these for the Preview environment (and Production if you use it) and redeploy. Keep the private VAPID key, QStash token, and cron secret private.

## Scheduler limits

The app creates a QStash recurring dispatcher while there are pending reminders. It checks for due reminders every five minutes and stops itself when the queue becomes empty. This works with preview deployments and avoids Vercel Cron's production-only and Hobby timing limits. While reminders are pending, the dispatcher uses 288 QStash messages per day, plus one message per delivered reminder; the free tier's daily quota may be exceeded if you have many reminders or long-running pending tasks.

Users still need to install the PWA on iPhone, grant notification permission, and enable reminders in Settings. Each device has its own subscription and reminder list.
