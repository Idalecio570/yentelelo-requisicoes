// Edge Function: process-approval
// Processa uma decisão de aprovação e notifica o criador por email

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ApprovalPayload {
  requisition_id: string
  aprovador_id:   string
  nivel:          1 | 2
  decisao:        "aprovado" | "rejeitado" | "devolvido"
  comentario?:    string | null
}

const STATUS_LABELS: Record<string, string> = {
  aprovado_escritorio: "Aprovado pelo Escritório",
  aprovado_final:      "Aprovado",
  rejeitado:           "Rejeitado",
  devolvido:           "Devolvido",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    // Verificar identidade do chamador via JWT
    const authHeader = req.headers.get("Authorization") ?? ""
    const jwt        = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const payload: ApprovalPayload = await req.json()
    const { requisition_id, aprovador_id, nivel, decisao, comentario } = payload

    // Garantir que aprovador_id corresponde ao utilizador autenticado
    if (aprovador_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "aprovador_id não corresponde ao utilizador autenticado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verificar role do aprovador para o nível pedido
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = callerProfile?.role
    const permitted =
      (nivel === 1 && (role === "gestor_escritorio" || role === "admin")) ||
      (nivel === 2 && (role === "director_geral"    || role === "admin"))

    if (!permitted) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para aprovar neste nível" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Busca a requisição com o perfil do criador
    const { data: req_data, error: reqErr } = await supabase
      .from("requisitions")
      .select("id, titulo, valor_estimado, status, criado_por, profile:profiles!criado_por(email, nome_completo, notif_email)")
      .eq("id", requisition_id)
      .single()

    if (reqErr || !req_data) {
      return new Response(
        JSON.stringify({ error: "Requisição não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Valida transição de estado
    if (nivel === 1 && req_data.status !== "pendente") {
      return new Response(
        JSON.stringify({ error: "Requisição não está pendente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    if (nivel === 2 && req_data.status !== "aprovado_escritorio") {
      return new Response(
        JSON.stringify({ error: "Requisição não está aprovada pelo escritório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Determina o próximo status — nivel 1 sempre → aprovado_escritorio
    let novo_status: string
    if (decisao === "rejeitado") {
      novo_status = "rejeitado"
    } else if (decisao === "devolvido") {
      novo_status = "devolvido"
    } else if (nivel === 1) {
      novo_status = "aprovado_escritorio"
    } else {
      novo_status = "aprovado_final"
    }

    // Insere o registo de aprovação
    const { error: approvalErr } = await supabase
      .from("approvals")
      .insert({ requisition_id, aprovador_id, nivel, decisao, comentario: comentario ?? null })

    if (approvalErr) throw approvalErr

    // Actualiza o status da requisição
    const { error: updateErr } = await supabase
      .from("requisitions")
      .update({ status: novo_status })
      .eq("id", requisition_id)

    if (updateErr) throw updateErr

    // Envia notificação por email ao criador (não bloqueia em caso de falha)
    try {
      const criador = req_data.profile as { email?: string; nome_completo?: string; notif_email?: boolean } | null
      if (criador?.email && criador?.notif_email !== false) {
        await enviarEmailNotificacao({
          destinatario_email: criador.email,
          destinatario_nome:  criador.nome_completo ?? "Utilizador",
          req_titulo:         req_data.titulo,
          req_id:             req_data.id,
          novo_status,
          comentario:         comentario ?? null,
        })
      }
    } catch { /* não-fatal */ }

    return new Response(
      JSON.stringify({ success: true, novo_status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// ---------------------------------------------------------------------------
// Email de notificação
// ---------------------------------------------------------------------------

async function enviarEmailNotificacao({
  destinatario_email,
  destinatario_nome,
  req_titulo,
  req_id,
  novo_status,
  comentario,
}: {
  destinatario_email:   string
  destinatario_nome:    string
  req_titulo:           string
  req_id:               string
  novo_status:          string
  comentario:           string | null
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""
  const SYSTEM_URL     = Deno.env.get("SYSTEM_URL") ?? "https://sistema.yentelelo.co.mz"

  if (!RESEND_API_KEY) return

  const statusLabel = STATUS_LABELS[novo_status] ?? novo_status
  const isFinal     = novo_status === "aprovado_final"
  const isRejected  = novo_status === "rejeitado"
  const isReturned  = novo_status === "devolvido"

  const statusColor = isFinal
    ? "#16a34a"
    : isRejected ? "#dc2626"
    : isReturned ? "#d97706"
    : "#2563eb"

  const mensagem = isReturned
    ? "A sua requisição foi devolvida para revisão. Por favor, actualize-a e ressubmeta."
    : isFinal
    ? "A sua requisição foi aprovada definitivamente e está pronta para processamento."
    : isRejected
    ? "A sua requisição foi rejeitada."
    : "A sua requisição avançou para aprovação pelo Director Geral."

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#dc2626;padding:20px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:bold;">Yentelelo</span>
            <span style="color:#fca5a5;font-size:12px;display:block;">Sistema de Requisições</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#6b7280;margin:0 0 8px;">Olá, <strong>${destinatario_nome}</strong></p>
            <h2 style="color:#111827;margin:0 0 20px;font-size:18px;">Actualização da sua Requisição</h2>

            <div style="background:#f9fafb;border-left:4px solid ${statusColor};border-radius:4px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Requisição</p>
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">${req_titulo}</p>
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Estado actual</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:${statusColor};">${statusLabel}</p>
            </div>

            <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">${mensagem}</p>

            ${comentario ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px;margin-bottom:20px;">
              <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:600;text-transform:uppercase;">Comentário do Aprovador</p>
              <p style="margin:0;color:#78350f;font-size:14px;">${comentario}</p>
            </div>` : ""}

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#dc2626;border-radius:6px;padding:10px 20px;">
                  <a href="${SYSTEM_URL}/requisitions/${req_id}" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Ver Requisição →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Yentelelo Group · <a href="mailto:suporte@yentelelo.co.mz" style="color:#dc2626;">suporte@yentelelo.co.mz</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    "Yentelelo <noreply@yentelelo.co.mz>",
      to:      [destinatario_email],
      subject: `Actualização da sua Requisição: ${req_titulo}`,
      html,
    }),
  })
}
