/**
 * Errors that tell you where in the spec things went wrong.
 *
 * A code generator that fails with a stack trace forces the user to guess which
 * of 4000 lines of YAML broke it. Every error here carries the location it came
 * from, and the CLI renders it as:
 *
 *   error: cannot resolve schema
 *     at paths./users.get.responses.200
 *     in openapi.yaml:42
 */

export interface ErrorLocation {
  /** File the problem came from. */
  file?: string;
  /** JSON path within the document, e.g. `paths./users.get.responses.200`. */
  pointer?: string;
  line?: number;
  column?: number;
}

export interface OpenQueryErrorOptions extends ErrorLocation {
  /** Actionable next step shown under the error. */
  hint?: string;
  cause?: unknown;
}

export class OpenQueryError extends Error {
  readonly file?: string;
  readonly pointer?: string;
  readonly line?: number;
  readonly column?: number;
  readonly hint?: string;

  constructor(message: string, options: OpenQueryErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'OpenQueryError';
    if (options.file !== undefined) this.file = options.file;
    if (options.pointer !== undefined) this.pointer = options.pointer;
    if (options.line !== undefined) this.line = options.line;
    if (options.column !== undefined) this.column = options.column;
    if (options.hint !== undefined) this.hint = options.hint;
  }

  /** Render for the terminal, including location and hint when known. */
  format(): string {
    const lines = [`error: ${this.message}`];
    if (this.pointer) lines.push(`  at ${this.pointer}`);
    if (this.file) {
      const position =
        this.line !== undefined
          ? `:${this.line}${this.column !== undefined ? `:${this.column}` : ''}`
          : '';
      lines.push(`  in ${this.file}${position}`);
    }
    if (this.hint) lines.push(`\n  ${this.hint}`);
    return lines.join('\n');
  }
}

/** A spec problem reported by the parser, normalized for display. */
export class SpecError extends OpenQueryError {
  constructor(message: string, options: OpenQueryErrorOptions = {}) {
    super(message, options);
    this.name = 'SpecError';
  }
}
