/** Public API. */

export { defineConfig } from './config/define.js';
export type {
  QueryFishConfig,
  PaginationConfig,
  ResolvedConfig,
} from './config/define.js';

export { generate } from './generate.js';
export type { GenerateOptions, GenerateResult, GeneratedFile } from './generate.js';

export { QueryFishError, SpecError } from './loader/errors.js';

// Exposed so tooling can build on the IR without re-parsing specs.
export { buildIR } from './ir/build.js';
export { loadSpec } from './loader/load.js';
export type { IR, IRSchema, Operation, PaginationSpec, Param } from './ir/types.js';

/**
 * Structural type a client module must satisfy.
 *
 * QueryFish ships no runtime: you provide this, so auth, interceptors, retries,
 * and base URLs stay in your code. axios instances satisfy it as-is.
 */
export interface QueryFishClient {
  request<T>(config: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    data?: unknown;
  }): Promise<T>;
}
