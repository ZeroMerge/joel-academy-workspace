import { createClient } from '@/lib/supabase/server';

interface NotificationPayload {
  title: string;
  message?: string;
  link?: string;
  [key: string]: any;
}

export async function sendNotification(
  userId: string,
  type: string,
  payload: NotificationPayload,
  alertWhatsAppGroup?: string // if provided, we send to this WhatsApp group via the gateway
) {
  const supabase = await createClient();

  // 1. In-app notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    payload
  });

  // 2. WhatsApp Gateway (if applicable)
  if (alertWhatsAppGroup && process.env.WHATSAPP_GATEWAY_URL && process.env.WHATSAPP_GATEWAY_TOKEN) {
    try {
      const url = `${process.env.WHATSAPP_GATEWAY_URL}/message/text`;
      // We assume an Evolution API or WAHA generic payload format
      const body = {
        number: alertWhatsAppGroup, // Group ID
        text: `*Joel Academy Alert: ${payload.title}*\n${payload.message || ''}\n${payload.link ? `Link: ${payload.link}` : ''}`
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.WHATSAPP_GATEWAY_TOKEN
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.error("WhatsApp notification failed, but in-app succeeded.", e);
      // We don't throw here because in-app is the system of record
    }
  }
}
