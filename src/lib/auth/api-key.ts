import crypto from "crypto";
import bcrypt from "bcryptjs";

const API_KEY_PREFIX = "xyb_";
const HEX_LENGTH = 32;
const DISPLAY_PREFIX_LENGTH = 8;

/**
 * Generate a new API Key
 * Format: xyb_ + 32 hex characters
 * Returns the full key (for one-time display) and the stored prefix + hash
 */
export async function generateApiKey(): Promise<{
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
}> {
  const randomPart = crypto.randomBytes(HEX_LENGTH / 2).toString("hex");
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;

  // Store first 8 chars of the key (after prefix) for display
  const keyPrefix = fullKey.slice(0, DISPLAY_PREFIX_LENGTH);

  // Hash the full key for storage
  const keyHash = await bcrypt.hash(fullKey, 10);

  return { fullKey, keyPrefix, keyHash };
}

/**
 * Verify an API Key against a stored hash
 */
export async function verifyApiKey(
  fullKey: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(fullKey, storedHash);
}

/**
 * Validate API Key format: xyb_ prefix + 32 hex chars
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^xyb_[0-9a-f]{32}$/.test(key);
}
