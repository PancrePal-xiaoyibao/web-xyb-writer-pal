const MAX_REWRITE_LENGTH = 2000;

/**
 * Strip all HTML and script tags from a string to prevent XSS injection.
 * Returns plain text content only.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  // Remove HTML tags
  return input
    .replace(/<[^>]*>/g, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    // Remove on* event handlers (onerror=, onclick=, etc.)
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Validate and sanitize rewrite instructions
 * - Max 2000 characters
 * - Strip HTML tags
 */
export function sanitizeRewriteInstructions(input: string | null | undefined): string | null {
  if (!input) return null;
  const sanitized = sanitizeInput(input);
  if (sanitized.length === 0) return null;
  return sanitized.slice(0, MAX_REWRITE_LENGTH);
}
