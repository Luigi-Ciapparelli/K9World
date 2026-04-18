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

async function sendEmail(target: string, code: string): Promise<{ ok: boolean; note: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { ok: false, note: "Dev mode: no email provider configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("VERIFICATION_FROM_EMAIL") || "onboarding@resend.dev",
        to: target,
        subject: "Your PawConnect verification code",
        html: `<div style="font-family:sans-serif;padding:24px"><h2>PawConnect verification</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes.</p></div>`,
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, note: `Email provider error: ${text.slice(0, 140)}` };
    }
    return { ok: true, note: "" };
  } catch (e) {
    return { ok: false, note: `Email provider exception: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

async function sendSms(target: string, code: string): Promise<{ ok: boolean; note: string }> {
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { ok: false, note: "Dev mode: no SMS provider configured" };
  }
  try {
    const form = new URLSearchParams({
      To: target,
      From: twilioFrom,
      Body: `Your PawConnect verification code is ${code}. It expires in 10 minutes.`,
    });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, note: `SMS provider error: ${text.slice(0, 140)}` };
    }
    return { ok: true, note: "" };
  } catch (e) {
    return { ok: false, note: `SMS provider exception: ${e instanceof Error ? e.message : "unknown"}` };
  }
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

    const { type, target } = await req.json();
    if (type !== "email" && type !== "phone") throw new Error("Invalid type");
    if (!target || typeof target !== "string" || target.trim().length === 0) {
      throw new Error(
        type === "email"
          ? "No email on file. Update your profile first."
          : "No phone on file. Add a phone number to your profile first."
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("verification_codes")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      throw new Error("Please wait 60 seconds before requesting another code");
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", hourAgo);
    if ((count || 0) >= 5) {
      throw new Error("Too many code requests. Please try again later.");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);

    const { error: insertErr } = await admin.from("verification_codes").insert({
      user_id: userId,
      type,
      target,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insertErr) throw new Error(insertErr.message);

    const result = type === "email" ? await sendEmail(target, code) : await sendSms(target, code);

    const body: Record<string, unknown> = {
      success: true,
      delivered: result.ok,
      note: result.note,
    };
    if (!result.ok) body.dev_code = code;

    return new Response(JSON.stringify(body), {
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
