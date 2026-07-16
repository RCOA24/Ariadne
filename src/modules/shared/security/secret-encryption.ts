import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const key = () => {
  const value = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!value)
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is required to save AI provider secrets.",
    );
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32)
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  return decoded;
};
export const encryptSecret = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
};
export const decryptSecret = (value: string) => {
  const input = Buffer.from(value, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    input.subarray(0, 12),
  );
  decipher.setAuthTag(input.subarray(12, 28));
  return Buffer.concat([
    decipher.update(input.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
};
