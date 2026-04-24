import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface NotifySelectionParams {
  clientName: string
  shootDate: string
  photoLimit: number
  totalSelected: number
  extraCount: number
  extraPrice: number | null
  sessionId: string
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function sendSelectionNotification(params: NotifySelectionParams) {
  const {
    clientName,
    shootDate,
    photoLimit,
    totalSelected,
    extraCount,
    extraPrice,
    sessionId,
  } = params

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const sessionUrl = `${appUrl}/dashboard/sessions/${sessionId}`
  const extraTotal = extraCount * (extraPrice ?? 0)

  const extrasHtml = extraCount > 0 && extraPrice
    ? `
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:14px;">Fotos extras</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;font-weight:600;color:#d97706;">
          ${extraCount} × ${fmt(extraPrice)} = ${fmt(extraTotal)}
        </td>
      </tr>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;background:#111;border-radius:8px;display:inline-block;text-align:center;line-height:32px;">
              <span style="color:white;font-size:16px;">📷</span>
            </div>
            <span style="font-weight:700;font-size:18px;color:#111;">PhotoSelect</span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">

          <!-- Ícone de check -->
          <div style="text-align:center;margin-bottom:20px;">
            <div style="width:56px;height:56px;background:#ecfdf5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;">✅</div>
          </div>

          <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111;text-align:center;">
            Seleção finalizada!
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">
            <strong style="color:#111;">${clientName}</strong> acabou de escolher as fotos do ensaio.
          </p>

          <!-- Detalhes -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;">
            <tr>
              <td style="padding:12px 0 8px;color:#6b7280;font-size:14px;">Cliente</td>
              <td style="padding:12px 0 8px;text-align:right;font-size:14px;font-weight:600;color:#111;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;">Data do ensaio</td>
              <td style="padding:8px 0;text-align:right;font-size:14px;color:#111;">${formatDate(shootDate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;">Fotos do pacote</td>
              <td style="padding:8px 0;text-align:right;font-size:14px;color:#111;">${photoLimit} incluídas</td>
            </tr>
            ${extrasHtml}
            <tr style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#111;">Total selecionado</td>
              <td style="padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#111;">${totalSelected} fotos</td>
            </tr>
          </table>

          <!-- Botão -->
          <div style="margin-top:28px;text-align:center;">
            <a href="${sessionUrl}"
               style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;">
              Ver fotos selecionadas →
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">PhotoSelect · Sistema de seleção de fotos</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: 'PhotoSelect <noreply@resend.dev>',
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `📸 ${clientName} finalizou a seleção — ${totalSelected} fotos`,
    html,
  })
}
