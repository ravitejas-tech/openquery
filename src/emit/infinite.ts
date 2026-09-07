/**
 * The `infiniteQueries.ts` output.
 *
 * Emitted ONLY for operations that explicitly opted in to pagination, via config
 * or an `x-openquery-pagination` extension. With no opt-in this file is not
 * written at all — OpenAPI has no pagination standard, and a guessed
 * `getNextPageParam` produces a hook that silently fetches forever.
 *
 * See docs/adr/0005-opt-in-pagination.md.
 */

import type { IR, Operation } from '../ir/types.js';
import { GENERATED_HEADER, jsdoc, stringLiteral } from './writer.js';
import {
  hasVariables,
  renderType,
  responseTypeName,
  variablesTypeName,
} from './types.js';
import { hookName, renderQueryKey } from './queries.js';

export function infiniteOperations(ir: IR): Operation[] {
  return ir.operations.filter((o) => o.kind === 'query' && o.pagination);
}

/**
 * TS type of the page param.
 *
 * Taken from the cursor parameter's own schema so it matches what the request
 * function accepts — inferring it from `initialPageParam` produces a type that
 * collides with the fetcher's real signature.
 *
 * Widened with `undefined` (not `null`) because that is what an optional query
 * parameter accepts, and what TanStack Query treats as "no further pages".
 */
function pageParamType(operation: Operation): string {
  const schema = operation.pagination?.paramSchema;
  const base = schema ? renderType(schema) : 'string';
  return base.includes('undefined') ? base : `${base} | undefined`;
}

function renderInitialPageParam(operation: Operation): string {
  const initial = operation.pagination?.initialPageParam;
  if (initial === null || initial === undefined) return 'undefined';
  return typeof initial === 'number' ? String(initial) : stringLiteral(initial);
}

/** Safe access for the next-cursor field, which may be a dotted path. */
function nextFieldAccess(nextField: string): string {
  return nextField
    .split('.')
    .map((segment) =>
      /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)
        ? `?.${segment}`
        : `?.[${JSON.stringify(segment)}]`,
    )
    .join('');
}

export function emitInfiniteQueries(ir: IR): string {
  const operations = infiniteOperations(ir);
  if (operations.length === 0) return '';

  const blocks: string[] = [GENERATED_HEADER];

  const typeImports = operations.flatMap((o) => [
    variablesTypeName(o),
    responseTypeName(o),
  ]);

  blocks.push(
    `import { createInfiniteQuery } from 'react-query-kit';\n` +
      `import {\n${operations.map((o) => `  ${o.operationId},`).join('\n')}\n} from './requests.js';\n` +
      `import type {\n${[...new Set(typeImports)].map((n) => `  ${n},`).join('\n')}\n} from './types.js';`,
  );

  for (const operation of operations) {
    const pagination = operation.pagination!;
    const doc = jsdoc({
      summary:
        operation.summary ?? `\`${operation.method.toUpperCase()} ${operation.path}\``,
      description: operation.description,
      deprecated: operation.deprecated,
    });

    const takesVariables = hasVariables(operation);
    // The cursor is supplied by pageParam, so callers must not set it — but the
    // request function still accepts it, so omit it only from the hook's type.
    const variables = takesVariables
      ? `Omit<${variablesTypeName(operation)}, ${JSON.stringify(pagination.param)}>`
      : 'void';
    const spread = takesVariables ? '...variables, ' : '';

    // The cursor comes from pageParam, never from variables — which is why the
    // IR strips it out of the variables type. The request function still
    // accepts it, so no cast is needed.
    const fetcher =
      `(variables, { pageParam }) =>\n` +
      `    ${operation.operationId}({ ${spread}${JSON.stringify(pagination.param)}: pageParam }),`;

    // Type parameters are <TFnData, TVariables, TError, TPageParam> — TError
    // sits third, so it must be named explicitly to reach TPageParam.
    blocks.push(
      `${doc}export const ${hookName(operation)}Infinite = createInfiniteQuery<\n` +
        `  ${responseTypeName(operation)},\n` +
        `  ${variables},\n` +
        `  Error,\n` +
        `  ${pageParamType(operation)}\n` +
        `>({\n` +
        `  queryKey: ${renderQueryKey(operation)},\n` +
        `  fetcher: ${fetcher}\n` +
        `  getNextPageParam: (lastPage) => lastPage${nextFieldAccess(pagination.nextField)} ?? undefined,\n` +
        `  initialPageParam: ${renderInitialPageParam(operation)},\n` +
        `});`,
    );
  }

  return blocks.join('\n\n') + '\n';
}
