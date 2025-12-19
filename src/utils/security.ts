import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize code to prevent XSS attacks
 * @param code - The code string to sanitize
 * @returns Sanitized code string
 */
export function sanitizeCode(code: string): string {
  // Remove script tags and dangerous patterns
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const eventHandlerPattern = /on\w+\s*=\s*["'][^"']*["']/gi;

  let sanitized = code
    .replace(scriptPattern, '')
    .replace(eventHandlerPattern, '');

  return DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Validate placeholder input based on type
 * @param value - The input value
 * @param type - The placeholder type
 * @returns boolean indicating if valid
 */
export function validatePlaceholderInput(
  value: string,
  type: 'text' | 'email' | 'url' | 'number' | 'date' | 'id'
): boolean {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'number':
      return !isNaN(Number(value));
    case 'date':
      return !isNaN(Date.parse(value));
    case 'id':
      return /^[a-zA-Z0-9_-]+$/.test(value);
    case 'text':
    default:
      return value.length > 0;
  }
}

/**
 * Replace placeholders in code with sanitized values
 * @param code - The code with placeholders
 * @param placeholders - Object with placeholder values
 * @returns Code with replaced placeholders
 */
export function replacePlaceholders(
  code: string,
  placeholders: Record<string, string>
): string {
  let result = code;

  Object.entries(placeholders).forEach(([key, value]) => {
    const sanitizedValue = sanitizeCode(value);
    const placeholderPattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(placeholderPattern, sanitizedValue);
  });

  return result;
}

/**
 * Rate limiting implementation using in-memory store
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the time window
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Hash sensitive data (for audit logs)
 */
export function hashSensitiveData(data: string): string {
  // Simple hash for demonstration - use crypto in production
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Validate SQL injection attempts
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(;|--|\*|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
