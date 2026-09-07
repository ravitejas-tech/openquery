/**
 * Identifier derivation and collision handling.
 *
 * Real-world specs routinely break naive generators: missing operationIds,
 * duplicates, characters that are not valid in identifiers, names that collide
 * with TypeScript reserved words. Every rule here has a test in
 * test/naming.test.ts — this module is where day-one bug reports come from.
 */

const RESERVED = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'as',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',
  'any',
  'boolean',
  'constructor',
  'declare',
  'get',
  'module',
  'require',
  'number',
  'set',
  'string',
  'symbol',
  'type',
  'from',
  'of',
  'object',
  'never',
  'unknown',
  'bigint',
]);

/** Split an arbitrary string into word parts, tolerating any separator style. */
function words(input: string): string[] {
  return (
    input
      // Split camelCase / PascalCase boundaries before normalizing separators.
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
  );
}

export function toCamelCase(input: string): string {
  const parts = words(input);
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return (
    first!.toLowerCase() +
    rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('')
  );
}

export function toPascalCase(input: string): string {
  const camel = toCamelCase(input);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Make a string safe to use as a TypeScript identifier.
 * Handles empty input, leading digits, and reserved words.
 */
export function safeIdentifier(input: string, fallback = 'value'): string {
  let id = toCamelCase(input);
  if (!id) id = fallback;
  if (/^[0-9]/.test(id)) id = `n${id.charAt(0).toUpperCase()}${id.slice(1)}`;
  if (RESERVED.has(id)) id = `${id}_`;
  return id;
}

/**
 * Whether a property name can be written bare in a type literal, or needs quoting.
 * Property names are NOT normalized — they must match the wire format exactly.
 */
export function isValidPropertyName(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

export function quotePropertyIfNeeded(name: string): string {
  return isValidPropertyName(name) ? name : JSON.stringify(name);
}

/**
 * Derive an operationId from method + path when the spec omits one.
 * `get /users/{id}/posts` → `getUsersByIdPosts`
 */
export function deriveOperationId(method: string, path: string): string {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const param = segment.match(/^\{(.+)\}$/);
      return param ? `by ${param[1]}` : segment;
    });
  return safeIdentifier([method, ...parts].join(' '), 'operation');
}

/**
 * Tracks used names and resolves collisions deterministically, so the same spec
 * always produces the same output.
 */
export class NameRegistry {
  private used = new Map<string, number>();

  /** Reserve `name`, returning it or a suffixed variant if already taken. */
  claim(name: string): { name: string; collided: boolean } {
    const count = this.used.get(name);
    if (count === undefined) {
      this.used.set(name, 1);
      return { name, collided: false };
    }
    // Find the next free suffix; guard against `foo2` already existing.
    let next = count + 1;
    let candidate = `${name}${next}`;
    while (this.used.has(candidate)) {
      next += 1;
      candidate = `${name}${next}`;
    }
    this.used.set(name, next);
    this.used.set(candidate, 1);
    return { name: candidate, collided: true };
  }

  has(name: string): boolean {
    return this.used.has(name);
  }
}
