// Accepts what people actually type (spaces, dashes, brackets, 00 prefix) and
// returns E.164, or null if it clearly isn't a full international number.
export function normalizePhone(raw: string): string | null {
  let v = raw.trim().replace(/[\s\-().]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  return /^\+[1-9]\d{7,14}$/.test(v) ? v : null;
}
