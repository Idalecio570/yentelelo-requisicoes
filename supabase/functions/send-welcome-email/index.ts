// Edge Function: send-welcome-email
// Envia email de boas-vindas com credenciais ao novo utilizador via Resend

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { nome, email, password } = await req.json()

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""
    const SYSTEM_URL     = Deno.env.get("SYSTEM_URL") ?? "https://sistema.yentelelo.co.mz"

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Cabeçalho -->
        <tr>
          <td style="background:#dc2626;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">Yentelelo</span>
            <span style="color:#fca5a5;font-size:12px;display:block;margin-top:2px;">Sistema de Requisições</span>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#111827;margin:0 0 16px;">Bem-vindo ao Sistema, ${nome}!</h2>
            <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
              A sua conta foi criada com sucesso. Utilize as credenciais abaixo para aceder ao sistema.
            </p>

            <!-- Credenciais -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">EMAIL</p>
                  <p style="margin:0 0 16px;color:#111827;font-size:15px;font-weight:500;">${email}</p>
                  <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">PASSWORD INICIAL</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:500;font-family:monospace;background:#fff;border:1px solid #e5e7eb;padding:8px 12px;border-radius:4px;display:inline-block;">${password}</p>
                </td>
              </tr>
            </table>

            <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
              Por razões de segurança, <strong>altere a sua password</strong> após o primeiro acesso.
            </p>

            <!-- Botão -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#dc2626;border-radius:6px;padding:12px 24px;">
                  <a href="${SYSTEM_URL}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Aceder ao Sistema →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              Yentelelo Group · Sistema de Gestão de Requisições<br/>
              Suporte: <a href="mailto:suporte@yentelelo.co.mz" style="color:#dc2626;">suporte@yentelelo.co.mz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Yentelelo <noreply@yentelelo.co.mz>",
        to:      [email],
        subject: "Bem-vindo ao Sistema Yentelelo",
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      return new Response(
        JSON.stringify({ error: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
