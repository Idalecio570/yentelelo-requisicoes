// Edge Function: create-user
// Cria utilizador no Auth + profile, envia email de boas-vindas
// Requer service_role key (não exposta no frontend)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { email, password, nome_completo, role, direcao_id, force_password_change } = await req.json()

    // 1. Cria utilizador no Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { force_password_change: force_password_change ?? false },
    })

    if (authErr || !authData.user) {
      return new Response(
        JSON.stringify({ error: authErr?.message ?? "Erro ao criar utilizador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Cria o profile
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id:            authData.user.id,
      nome_completo,
      email,
      role,
      direcao_id:    direcao_id ?? null,
      ativo:         true,
      notif_email:   true,
    })

    if (profileErr) {
      // Rollback do auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: profileErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Envia email de boas-vindas (não bloqueia em caso de falha)
    try {
      await supabase.functions.invoke("send-welcome-email", {
        body: { nome: nome_completo, email, password, role },
      })
    } catch { /* não-fatal */ }

    return new Response(
      JSON.stringify({ success: true, id: authData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
