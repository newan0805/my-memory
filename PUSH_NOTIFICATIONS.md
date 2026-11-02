# Background push notifications

The app keeps tasks and schedules on each device. When background push is enabled, it sends the device's push subscription and the due reminder details to the Vercel API. Upstash Redis stores those pending reminders; the scheduled function sends them through Web Push when they are due.

## Vercel environment variables

Connect an Upstash Redis database to the Vercel project. The integration supplies:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Generate a VAPID key pair with `npx web-push generate-vapid-keys --json`, then add:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (for example, `mailto:admin@example.com`)
- `CRON_SECRET` (a random secret of at least 32 characters)

Set these for the Production environment and redeploy. Keep the private VAPID key and cron secret private.

## Scheduler limits

`vercel.json` runs `/api/cron/push` every minute. Vercel creates Cron Jobs only for production deployments, not preview deployments. Minute-level timing requires Vercel Pro; Hobby allows only one scheduled run per day, which is too infrequent for task reminders. The current `dev-test` preview therefore does not run the delivery scheduler.

Users still need to install the PWA on iPhone, grant notification permission, and enable reminders in Settings. Each device has its own subscription and reminder list.
