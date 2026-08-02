const KNOWN_SECRET_PATTERNS = [
  /\bnsec1[023456789acdefghjklmnpqrstuvwxyz]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bya29\.[0-9A-Za-z_-]{20,}\b/,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bnpm_[A-Za-z0-9]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
] as const;

const BASE64_RUN = /[A-Za-z0-9+/]{80,}={0,2}/g;
const PRIVATE_KEY_MARKER = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const PUBLIC_LABEL_CONTROL = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u;
const SPOOFING_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;

export function containsKnownSecret(value: string): boolean {
  if (KNOWN_SECRET_PATTERNS.some((pattern) => pattern.test(value))) return true;
  if (value.startsWith("data:image/")) return false;

  let inspected = 0;
  for (const match of value.matchAll(BASE64_RUN)) {
    const encoded = match[0];
    if (encoded.length > 32_768 || encoded.length % 4 !== 0) continue;
    inspected += 1;
    if (inspected > 16) break;
    try {
      const decoded = atob(encoded);
      if (PRIVATE_KEY_MARKER.test(decoded)) return true;
    } catch {
      // Invalid base64 is not evidence of a credential.
    }
  }
  return false;
}

export function containsSpoofingControl(value: string): boolean {
  return SPOOFING_CONTROL.test(value);
}

export function isSafePublicLabel(value: unknown, min: number, max: number): value is string {
  return typeof value === "string"
    && value.trim().length >= min
    && value.length <= max
    && !PUBLIC_LABEL_CONTROL.test(value);
}
