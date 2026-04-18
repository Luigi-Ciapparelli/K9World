import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Missing auth token");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { type, code } = await req.json();
    if (type !== "email" && type !== "phone") throw new Error("Invalid type");
    if (!code || typeof code !== "string") throw new Error("Missing code");

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: rows, error: selErr } = await admin
      .from("verification_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .is("consumed_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (selErr) throw new Error(selErr.message);
    if (!rows || rows.length === 0) throw new Error("No active code. Request a new one.");

    const record = rows[0];

    if ((record.attempt_count || 0) >= 5) {
      throw new Error("Too many attempts. Request a new code.");
    }

    const codeHash = await sha256(code.trim());
    if (codeHash !== record.code_hash) {
      await admin
        .from("verification_codes")
        .update({ attempt_count: (record.attempt_count || 0) + 1 })
        .eq("id", record.id);
      throw new Error("Invalid code");
    }

    await admin
      .from("verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id);

    const patch = type === "email" ? { email_verified: true } : { phone_verified: true };
    const { error: updErr } = await admin.from("profiles").update(patch).eq("id", userId);
    if (updErr) throw new Error(updErr.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
