/** The `requests.ts` output: plain async functions, no React involved. */

import type { IR, Operation } from '../ir/types.js'
import { quotePropertyIfNeeded } from '../ir/naming.js'
import { GENERATED_HEADER, jsdoc, stringLiteral } from './writer.js'
import { hasVariables, responseTypeName, variablesTypeName } from './types.js'

/** `/users/{id}` → `` `/users/${variables.id}` `` (or a plain literal if static). */
function renderUrl(operation: Operation): string {
    if (operation.pathParams.length === 0) return stringLiteral(operation.path)

    const interpolated = operation.path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
        const param = operation.pathParams.find((p) => p.name === name)
        const accessor = param ? param.propertyName : name
        return '${' + `variables.${accessorFor(accessor)}` + '}'
    })
    return `\`${interpolated}\``
}

/** Bare property access where possible, bracket access when the name needs quoting. */
function accessorFor(name: string): string {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : `[${JSON.stringify(name)}]`
}

function propertyAccess(base: string, name: string): string {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? `${base}.${name}` : `${base}[${JSON.stringify(name)}]`
}

function renderRecord(entries: Array<{ key: string; value: string }>, indent: string): string {
    const inner = `${indent}  `
    const lines = entries.map((e) => `${inner}${quotePropertyIfNeeded(e.key)}: ${e.value},`)
    return `{\n${lines.join('\n')}\n${indent}}`
}

export function emitRequests(ir: IR, clientImport: string): string {
    const blocks: string[] = [GENERATED_HEADER]

    const typeNames = ir.operations.flatMap((operation) => [variablesTypeName(operation), responseTypeName(operation)])

    blocks.push(
        `import { client } from ${stringLiteral(clientImport)};\n` +
            (typeNames.length > 0
                ? `import type {\n${[...new Set(typeNames)].map((n) => `  ${n},`).join('\n')}\n} from './types.js';`
                : ''),
    )

    for (const operation of ir.operations) {
        const takesVariables = hasVariables(operation)
        const doc = jsdoc({
            summary: operation.summary ?? `\`${operation.method.toUpperCase()} ${operation.path}\``,
            description: operation.description,
            deprecated: operation.deprecated,
        })

        const signature = takesVariables ? `variables: ${variablesTypeName(operation)}` : ''

        const requestFields: Array<{ key: string; value: string }> = [
            { key: 'method', value: stringLiteral(operation.method.toUpperCase()) },
            { key: 'url', value: renderUrl(operation) },
        ]

        if (operation.queryParams.length > 0) {
            requestFields.push({
                key: 'params',
                value: renderRecord(
                    operation.queryParams.map((p) => ({
                        key: p.name,
                        value: propertyAccess('variables', p.propertyName),
                    })),
                    '    ',
                ),
            })
        }

        if (operation.headerParams.length > 0) {
            requestFields.push({
                key: 'headers',
                value: renderRecord(
                    operation.headerParams.map((p) => ({
                        key: p.name,
                        value: propertyAccess('variables', p.propertyName),
                    })),
                    '    ',
                ),
            })
        }

        if (operation.requestBody) {
            requestFields.push({ key: 'data', value: 'variables.body' })
        }

        blocks.push(
            `${doc}export const ${operation.operationId} = (${signature}) =>\n` +
                `  client.request<${responseTypeName(operation)}>(${renderRecord(requestFields, '  ')});`,
        )
    }

    return blocks.join('\n\n') + '\n'
}
