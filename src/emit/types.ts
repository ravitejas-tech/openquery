/** IRSchema → TypeScript type text, and the `types.ts` output file. */

import type { IR, IRSchema, Operation, Param } from '../ir/types.js';
import { quotePropertyIfNeeded, toPascalCase } from '../ir/naming.js';
import { GENERATED_HEADER, jsdoc } from './writer.js';

/** Render a schema as a TypeScript type expression. */
export function renderType(schema: IRSchema, indent = ''): string {
  switch (schema.kind) {
    case 'primitive':
      return schema.type;

    case 'literal':
      if (schema.values.length === 0) return 'never';
      return schema.values
        .map((v) => (typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : String(v)))
        .join(' | ');

    case 'null':
      return 'null';

    case 'array': {
      const inner = renderType(schema.items, indent);
      // Keep precedence correct for unions and intersections.
      return needsParens(schema.items) ? `Array<${inner}>` : `${inner}[]`;
    }

    case 'record':
      return `Record<string, ${renderType(schema.value, indent)}>`;

    case 'union':
      return schema.members.map((m) => renderType(m, indent)).join(' | ');

    case 'intersection':
      return schema.members
        .map((m) =>
          needsParens(m) ? `(${renderType(m, indent)})` : renderType(m, indent),
        )
        .join(' & ');

    case 'ref':
      return schema.name;

    case 'object':
      return renderObject(schema, indent);

    case 'void':
      return 'void';

    case 'unknown':
    default:
      return 'unknown';
  }
}

function needsParens(schema: IRSchema): boolean {
  return schema.kind === 'union' || schema.kind === 'intersection';
}

function renderObject(
  schema: Extract<IRSchema, { kind: 'object' }>,
  indent: string,
): string {
  if (schema.properties.length === 0 && !schema.additional) {
    return 'Record<string, unknown>';
  }

  const inner = `${indent}  `;
  const lines: string[] = [];

  for (const property of schema.properties) {
    const doc = jsdoc(
      { description: property.description, deprecated: property.deprecated },
      inner,
    );
    if (doc) lines.push(doc.trimEnd());
    const optional = property.required ? '' : '?';
    lines.push(
      `${inner}${quotePropertyIfNeeded(property.name)}${optional}: ${renderType(property.schema, inner)};`,
    );
  }

  if (schema.additional) {
    lines.push(`${inner}[key: string]: ${renderType(schema.additional, inner)};`);
  }

  return `{\n${lines.join('\n')}\n${indent}}`;
}

/** Name of the generated variables type for an operation. */
export function variablesTypeName(operation: Operation): string {
  return `${toPascalCase(operation.operationId)}Variables`;
}

/** Name of the generated response type for an operation. */
export function responseTypeName(operation: Operation): string {
  return `${toPascalCase(operation.operationId)}Response`;
}

/** All parameters that appear in an operation's variables object. */
export function variableParams(operation: Operation): Param[] {
  return [...operation.pathParams, ...operation.queryParams, ...operation.headerParams];
}

/** Whether an operation takes any variables at all. */
export function hasVariables(operation: Operation): boolean {
  return variableParams(operation).length > 0 || operation.requestBody !== undefined;
}

function renderVariables(operation: Operation): string {
  const params = variableParams(operation);
  const lines: string[] = [];

  for (const param of params) {
    const doc = jsdoc({ description: param.description }, '  ');
    if (doc) lines.push(doc.trimEnd());
    lines.push(
      `  ${quotePropertyIfNeeded(param.propertyName)}${param.required ? '' : '?'}: ${renderType(param.schema, '  ')};`,
    );
  }

  if (operation.requestBody) {
    lines.push(
      `  body${operation.requestBody.required ? '' : '?'}: ${renderType(operation.requestBody.schema, '  ')};`,
    );
  }

  if (lines.length === 0) return 'void';
  return `{\n${lines.join('\n')}\n}`;
}

export function emitTypes(ir: IR): string {
  const blocks: string[] = [GENERATED_HEADER];

  for (const type of ir.types) {
    const doc = jsdoc({ description: type.description });
    const rendered = renderType(type.schema);
    // `interface` reads better for plain objects; everything else is an alias.
    if (type.schema.kind === 'object' && rendered.startsWith('{')) {
      blocks.push(`${doc}export interface ${type.name} ${rendered}`);
    } else {
      blocks.push(`${doc}export type ${type.name} = ${rendered};`);
    }
  }

  for (const operation of ir.operations) {
    const variables = renderVariables(operation);
    const doc = jsdoc({
      summary: `Variables for \`${operation.method.toUpperCase()} ${operation.path}\`.`,
    });
    blocks.push(`${doc}export type ${variablesTypeName(operation)} = ${variables};`);
    blocks.push(
      `export type ${responseTypeName(operation)} = ${renderType(operation.response)};`,
    );
  }

  return blocks.join('\n\n') + '\n';
}
