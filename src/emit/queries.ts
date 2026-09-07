/** The `queries.ts` output: `createQuery` factories for GET/HEAD operations. */

import type { IR, Operation } from '../ir/types.js';
import { toPascalCase } from '../ir/naming.js';
import { GENERATED_HEADER, jsdoc, stringLiteral } from './writer.js';
import { hasVariables, responseTypeName, variablesTypeName } from './types.js';

/**
 * The query key is the path's literal segments.
 *
 * react-query-kit appends `variables` automatically, so `['users', '{id}']`
 * becomes `['users', '{id}', { id: '123' }]` at runtime — cache entries stay
 * separated per-variable, while a prefix match still invalidates the whole
 * resource tree:
 *
 *   queryClient.invalidateQueries({ queryKey: ['users'] })
 *
 * See docs/adr/0004-path-segment-query-keys.md.
 */
export function renderQueryKey(operation: Operation): string {
  if (operation.pathSegments.length === 0) return `['/']`;
  return `[${operation.pathSegments.map(stringLiteral).join(', ')}]`;
}

export function hookName(operation: Operation): string {
  return `use${toPascalCase(operation.operationId)}`;
}

/** Queries that are not paginated; paginated ones go to infiniteQueries.ts. */
export function plainQueries(ir: IR): Operation[] {
  return ir.operations.filter((o) => o.kind === 'query' && !o.pagination);
}

export function emitQueries(ir: IR): string {
  const operations = plainQueries(ir);
  if (operations.length === 0) return '';

  const blocks: string[] = [GENERATED_HEADER];

  const typeImports = operations.flatMap((o) => [
    variablesTypeName(o),
    responseTypeName(o),
  ]);

  blocks.push(
    `import { createQuery } from 'react-query-kit';\n` +
      `import {\n${operations.map((o) => `  ${o.operationId},`).join('\n')}\n} from './requests.js';\n` +
      `import type {\n${[...new Set(typeImports)].map((n) => `  ${n},`).join('\n')}\n} from './types.js';`,
  );

  for (const operation of operations) {
    const doc = jsdoc({
      summary:
        operation.summary ?? `\`${operation.method.toUpperCase()} ${operation.path}\``,
      description: operation.description,
      deprecated: operation.deprecated,
    });

    const takesVariables = hasVariables(operation);
    const variables = takesVariables ? variablesTypeName(operation) : 'void';
    // Request functions for variable-less operations take no arguments, so they
    // cannot be passed directly as a fetcher.
    const fetcher = takesVariables
      ? operation.operationId
      : `() => ${operation.operationId}()`;

    blocks.push(
      `${doc}export const ${hookName(operation)} = createQuery<${responseTypeName(operation)}, ${variables}>({\n` +
        `  queryKey: ${renderQueryKey(operation)},\n` +
        `  fetcher: ${fetcher},\n` +
        `});`,
    );
  }

  return blocks.join('\n\n') + '\n';
}
