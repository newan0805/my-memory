export default function handler(_request, response) {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return response.status(503).json({ error: 'Push notifications are not configured yet.' });
  }
  return response.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
