/**
 * Spec loading.
 *
 * Delegates to @redocly/openapi-core, which pulls remote and cross-file
 * references into a single self-contained document and handles OpenAPI 3.0,
 * 3.1, and Swagger 2.0.
 *
 * We deliberately bundle WITHOUT `dereference`. Dereferencing inlines every
 * `$ref`, which for a self-referential schema (`Comment.replies`,
 * `Category.children`) produces circular JavaScript objects — the document can
 * no longer be JSON.stringify'd, and a generator cannot tell a recursive type
 * from a deeply nested anonymous one. Keeping `$ref` pointers intact means
 * recursion is explicit and resolvable by pointer, which is exactly what the
 * type emitter needs to emit `replies?: Comment[]` instead of giving up.
 */

import path from 'node:path';
import { bundle, createConfig } from '@redocly/openapi-core';

import { SpecError } from './errors.js';

export interface LoadedSpec {
  /** Self-contained document with internal `$ref` pointers preserved. */
  document: Record<string, any>;
  /** Absolute path or URL the spec came from, for error messages. */
  source: string;
  /** Non-fatal problems reported by the parser. */
  warnings: string[];
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

export async function loadSpec(input: string, root: string): Promise<LoadedSpec> {
  const source = isUrl(input) ? input : path.resolve(root, input);

  let result;
  try {
    const config = await createConfig({ extends: ['minimal'] });
    // No dereference, so recursion stays expressible. See the module comment
    // and docs/adr/0003-bundle-without-dereferencing.md.
    result = await bundle({ ref: source, config, dereference: false });
  } catch (error) {
    throw new SpecError(
      error instanceof Error ? error.message : 'Failed to load specification.',
      {
        file: source,
        cause: error,
        hint: 'Check that the path or URL is correct and the document is valid OpenAPI.',
      },
    );
  }

  const document = result.bundle.parsed as Record<string, any>;

  if (!document || typeof document !== 'object') {
    throw new SpecError('Specification did not parse into a document.', { file: source });
  }

  // Fail early with a clear message rather than emitting an empty client.
  if (!document['openapi'] && !document['swagger']) {
    throw new SpecError('Not an OpenAPI or Swagger document.', {
      file: source,
      hint: 'The document must have a top-level `openapi` or `swagger` version field.',
    });
  }

  const warnings = (result.problems ?? [])
    .filter((problem: any) => problem.severity !== 'error')
    .map((problem: any) => {
      const location = problem.location?.[0]?.pointer;
      return location ? `${problem.message} (at ${location})` : String(problem.message);
    });

  const errors = (result.problems ?? []).filter((p: any) => p.severity === 'error');
  const first = errors[0];
  if (first) {
    throw new SpecError(String(first.message), {
      file: first.location?.[0]?.source?.absoluteRef ?? source,
      pointer: first.location?.[0]?.pointer,
      hint:
        errors.length > 1
          ? `${errors.length - 1} more error(s) in this document.`
          : undefined,
    });
  }

  return { document, source, warnings };
}
