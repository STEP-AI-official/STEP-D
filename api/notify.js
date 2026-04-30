export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  const results = { slack: false, gmail: false };

  // ── Slack ──────────────────────────────────────────────────────────
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      const r = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: '📬 STEP D — 새 문의', emoji: true } },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*회사명*\n${data.companyName}` },
                { type: 'mrkdwn', text: `*담당자*\n${data.contactName}` },
                { type: 'mrkdwn', text: `*이메일*\n${data.email}` },
                { type: 'mrkdwn', text: `*연락처*\n${data.phone || '-'}` },
                { type: 'mrkdwn', text: `*유형*\n${(data.projectTypes || []).join(', ') || '-'}` },
                { type: 'mrkdwn', text: `*단계*\n${data.stage || '-'}` },
                { type: 'mrkdwn', text: `*일정*\n${data.schedule || '-'}` },
                { type: 'mrkdwn', text: `*예산*\n${data.budget || '-'}` },
              ],
            },
            ...(data.description
              ? [{ type: 'section', text: { type: 'mrkdwn', text: `*문의 내용*\n${data.description}` } }]
              : []),
            { type: 'divider' },
          ],
        }),
      });
      results.slack = r.ok;
    } catch (e) {
      console.error('Slack error:', e);
    }
  }

  // ── Gmail (OAuth2) ─────────────────────────────────────────────────
  const { GMAIL_USER: gmailUser, GMAIL_CLIENT_ID: clientId,
          GMAIL_CLIENT_SECRET: clientSecret, GMAIL_REFRESH_TOKEN: refreshToken,
          GMAIL_TO: gmailTo } = process.env;

  if (gmailUser && clientId && clientSecret && refreshToken && gmailTo) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId, client_secret: clientSecret,
          refresh_token: refreshToken, grant_type: 'refresh_token',
        }),
      });
      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token;
      if (!accessToken) throw new Error(`Token error: ${JSON.stringify(tokenJson)}`);

      const bodyText = [
        `회사명: ${data.companyName}`,
        `담당자: ${data.contactName}`,
        `이메일: ${data.email}`,
        `연락처: ${data.phone || '-'}`,
        `유형: ${(data.projectTypes || []).join(', ') || '-'}`,
        `단계: ${data.stage || '-'}`,
        `일정: ${data.schedule || '-'}`,
        `예산: ${data.budget || '-'}`,
        ...(data.description ? [`\n문의 내용:\n${data.description}`] : []),
        ...(data.links?.length ? [`\n참고 링크:\n${data.links.join('\n')}`] : []),
      ].join('\n');

      const subject = `[STEP D 문의] ${data.companyName} - ${data.contactName}`;
      const mime = [
        `To: ${gmailTo}`,
        `From: STEP D <${gmailUser}>`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(bodyText).toString('base64'),
      ].join('\r\n');

      const raw = Buffer.from(mime)
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      });
      if (!sendRes.ok) throw new Error(JSON.stringify(await sendRes.json()));
      results.gmail = true;
    } catch (e) {
      console.error('Gmail error:', e instanceof Error ? e.message : e);
    }
  }

  return res.status(200).json({ ok: true, ...results });
}
