/** The `mutations.ts` output: `createMutation` factories for non-GET operations. */

import type { IR, Operation } from '../ir/types.js'
import { GENERATED_HEADER, jsdoc } from './writer.js'
import { hasVariables, responseTypeName, variablesTypeName } from './types.js'
import { hookName } from './queries.js'

export function mutationOperations(ir: IR): Operation[] {
    return ir.operations.filter((o) => o.kind === 'mutation')
}

export function emitMutations(ir: IR): string {
    const operations = mutationOperations(ir)
    if (operations.length === 0) return ''

    const blocks: string[] = [GENERATED_HEADER]

    const typeImports = operations.flatMap((o) => [variablesTypeName(o), responseTypeName(o)])

    blocks.push(
        `import { createMutation } from 'react-query-kit';\n` +
            `import {\n${operations.map((o) => `  ${o.operationId},`).join('\n')}\n} from './requests.js';\n` +
            `import type {\n${[...new Set(typeImports)].map((n) => `  ${n},`).join('\n')}\n} from './types.js';`,
    )

    for (const operation of operations) {
        const doc = jsdoc({
            summary: operation.summary ?? `\`${operation.method.toUpperCase()} ${operation.path}\``,
            description: operation.description,
            deprecated: operation.deprecated,
        })

        const takesVariables = hasVariables(operation)
        const variables = takesVariables ? variablesTypeName(operation) : 'void'
        const mutationFn = takesVariables ? operation.operationId : `() => ${operation.operationId}()`

        blocks.push(
            `${doc}export const ${hookName(operation)} = createMutation<${responseTypeName(operation)}, ${variables}>({\n` +
                `  mutationFn: ${mutationFn},\n` +
                `});`,
        )
    }

    return blocks.join('\n\n') + '\n'
}
