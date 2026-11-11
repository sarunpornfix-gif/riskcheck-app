// api/notify-admin.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { ticketId, reporterName, area, hazardType, riskLevel, riskScore } = req.body;

  const ADMIN_CHANNEL_ACCESS_TOKEN = "NsVrAuCpDEqHMxb1Hro1eCqDt2QTG6HkOtSqbAT/rRs1L3eKely3hMobj9YlGnLxG7pcyrPs/mJuhBeoTjI5s9014I921gWHxy5Pn6xGlJbf/RsOgGKbGi+ybKGS4R2Zuhme2cPox6beSfBKlKiJKAdB04t89/1O/w1cDnyilFU=";
  const ADMIN_USER_ID = "U692c5dd9a7c11b1ca5fb2436011abdc7";

  const payload = {
    to: ADMIN_USER_ID,
    messages: [
      {
        type: 'flex',
        altText: `🚨 แจ้งเหตุใหม่! [${ticketId}] พื้นที่: ${area}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#7E212A',
            contents: [
              { type: 'text', text: '🚨 แจ้งเหตุ Near Miss ใหม่!', color: '#FFFFFF', weight: 'bold', size: 'sm' }
            ]
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: `Ticket ID: ${ticketId}`, weight: 'bold', size: 'md', color: '#7E212A' },
              { type: 'separator', margin: 'sm' },
              { type: 'text', text: `ผู้แจ้ง: ${reporterName}`, size: 'xs', margin: 'md', color: '#555555' },
              { type: 'text', text: `พื้นที่เกิดเหตุ: ${area}`, size: 'xs', margin: 'xs', color: '#555555' },
              { type: 'text', text: `ประเภทอันตราย: ${hazardType}`, size: 'xs', margin: 'xs', color: '#555555' },
              { type: 'text', text: `ความเสี่ยง: ${riskLevel} (Score: ${riskScore})`, size: 'xs', margin: 'xs', weight: 'bold', color: '#D97706' }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'เปิด Dashboard จัดการเคส',
                  uri: `https://${req.headers.host}/dashboard.html`
                },
                style: 'primary',
                color: '#7E212A'
              }
            ]
          }
        }
      }
    ]
  };

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}