/**
 * CertiLink — custodia mínima de billeteras académicas (Edge, AES-GCM).
 *
 * Secretos (Edge / Supabase Dashboard → Functions → Secrets):
 * - EDGE_WALLET_INVOKER_SECRET: mismo valor que VITE_EDGE_WALLET_INVOKER_SECRET en el cliente
 * - STUDENT_WALLET_CUSTODY_AES_KEY: frase o hex; se deriva clave AES-256 vía SHA-256(UTF-8)
 *
 * Auto-inyectados por Supabase:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Opcional:
 * - STUDENT_WALLET_NETWORK (default: devnet)
 */
// @ts-nocheck — runtime Deno Edge (tipos locales opcionales)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Keypair } from "https://esm.sh/@solana/web3.js@1.98.2";
import bs58 from "https://esm.sh/bs58@6.0.0";

const V1_PREFIX = "v1.";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-certilink-custody-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveAesKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("STUDENT_WALLET_CUSTODY_AES_KEY")?.trim();
  if (!raw) throw new Error("missing_STUDENT_WALLET_CUSTODY_AES_KEY");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptSecretBs58(plainBs58: string): Promise<string> {
  const key = await deriveAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(plainBs58);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return `${V1_PREFIX}${bytesToBase64(combined)}`;
}

function assertInvoker(req: Request) {
  const expected = Deno.env.get("EDGE_WALLET_INVOKER_SECRET")?.trim();
  if (!expected) throw new Error("missing_EDGE_WALLET_INVOKER_SECRET");
  const got = req.headers.get("x-certilink-custody-secret")?.trim();
  if (got !== expected) throw new Error("unauthorized_invoker");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" });

  try {
    assertInvoker(req);
    const body = (await req.json()) as {
      action?: string;
      otec_id?: string;
      alumno_id?: string;
      legacy_secret_bs58?: string | null;
    };

    if (body.action !== "ensure") return json({ ok: false, error: "unknown_action" });

    const otecId = body.otec_id?.trim();
    const alumnoId = body.alumno_id?.trim();
    if (!otecId || !alumnoId) return json({ ok: false, error: "missing_otec_or_alumno" });

    const network = (Deno.env.get("STUDENT_WALLET_NETWORK")?.trim() || "devnet") as string;

    const url = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!url || !serviceKey) return json({ ok: false, error: "missing_supabase_env" });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: alumno, error: alumnoErr } = await admin
      .from("alumnos")
      .select("id, otec_id, wallet_address")
      .eq("id", alumnoId)
      .single();

    if (alumnoErr || !alumno || alumno.otec_id !== otecId) {
      return json({ ok: false, error: "alumno_not_found_or_tenant_mismatch" });
    }

    const { data: existing } = await admin
      .from("student_wallets")
      .select("id, wallet_address")
      .eq("alumno_id", alumnoId)
      .eq("network", network)
      .eq("status", "active")
      .maybeSingle();

    if (existing?.id && existing.wallet_address) {
      return json({
        ok: true,
        public_key: existing.wallet_address,
        student_wallet_id: existing.id,
        created: false,
      });
    }

    const addr = alumno.wallet_address as string | null;

    if (!addr) {
      const kp = Keypair.generate();
      const publicKey = kp.publicKey.toBase58();
      const secretBs58 = bs58.encode(kp.secretKey);
      const encrypted = await encryptSecretBs58(secretBs58);

      const { data: inserted, error: insErr } = await admin
        .from("student_wallets")
        .insert({
          alumno_id: alumnoId,
          otec_id: otecId,
          wallet_address: publicKey,
          encrypted_private_key: encrypted,
          blockchain: "solana",
          network,
          provider: "certilink-custody-edge",
          is_custodial: true,
          status: "active",
        })
        .select("id")
        .single();

      if (insErr) {
        if (insErr.code === "23505") {
          const { data: again } = await admin
            .from("student_wallets")
            .select("id, wallet_address")
            .eq("alumno_id", alumnoId)
            .eq("network", network)
            .eq("status", "active")
            .maybeSingle();
          if (again?.id) {
            return json({
              ok: true,
              public_key: again.wallet_address,
              student_wallet_id: again.id,
              created: false,
            });
          }
        }
        return json({ ok: false, error: insErr.message || "insert_failed" });
      }

      const { error: upErr } = await admin.from("alumnos").update({ wallet_address: publicKey }).eq("id", alumnoId);
      if (upErr) return json({ ok: false, error: upErr.message || "alumno_update_failed" });

      return json({
        ok: true,
        public_key: publicKey,
        student_wallet_id: inserted.id,
        created: true,
      });
    }

    const legacy = body.legacy_secret_bs58?.trim();
    if (!legacy) {
      return json({ ok: false, error: "legacy_secret_required", detail: "alumno_has_address_but_no_student_wallet_row" });
    }

    let kp: InstanceType<typeof Keypair>;
    try {
      kp = Keypair.fromSecretKey(bs58.decode(legacy));
    } catch {
      return json({ ok: false, error: "invalid_legacy_secret" });
    }

    if (kp.publicKey.toBase58() !== addr) {
      return json({ ok: false, error: "legacy_secret_pubkey_mismatch" });
    }

    const encrypted = await encryptSecretBs58(legacy);

    const { data: inserted, error: insErr } = await admin
      .from("student_wallets")
      .insert({
        alumno_id: alumnoId,
        otec_id: otecId,
        wallet_address: addr,
        encrypted_private_key: encrypted,
        blockchain: "solana",
        network,
        provider: "certilink-custody-edge",
        is_custodial: true,
        status: "active",
      })
      .select("id")
      .single();

    if (insErr) {
      return json({ ok: false, error: insErr.message || "insert_failed" });
    }

    return json({
      ok: true,
      public_key: addr,
      student_wallet_id: inserted.id,
      created: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg });
  }
});
