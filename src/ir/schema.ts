/**
 * OpenAPI schema → IRSchema.
 *
 * The loader hands us a self-contained document with `$ref` pointers intact
 * (see src/loader/load.ts for why we do not dereference). That makes recursion
 * explicit: `Comment.replies.items` is a `$ref` back to `Comment`, so the
 * emitter can produce `replies?: Comment[]` rather than inlining forever.
 *
 * Two mechanisms keep the walk finite:
 *   1. Every `#/components/schemas` entry is registered up front, so any `$ref`
 *      to one resolves to its emitted type name instead of being expanded.
 *   2. A guard set of in-progress pointers catches any cycle that somehow is
 *      not rooted at a named component.
 */

import type { IRProperty, IRSchema, NamedType } from './types.js'
import { type NameRegistry, quotePropertyIfNeeded, toPascalCase } from './naming.js'

/** Loosely-typed OpenAPI schema object. */
type RawSchema = Record<string, any>

export class SchemaConverter {
    /** JSON pointer (e.g. `#/components/schemas/Pet`) → emitted type name. */
    private namedByPointer = new Map<string, string>()
    private types: NamedType[] = []
    private registry: NameRegistry
    private warnings: string[] = []
    private document: RawSchema = {}
    /** Pointers currently being expanded, to catch non-component cycles. */
    private inProgress = new Set<string>()

    constructor(registry: NameRegistry) {
        this.registry = registry
    }

    /**
     * Register named schemas up front so `$ref`s resolve to names rather than
     * inline expansions. Must run before any convert() call.
     *
     * Handles both OpenAPI 3 (`components.schemas`) and Swagger 2 (`definitions`).
     */
    registerComponents(document: RawSchema): void {
        this.document = document

        const sources: Array<{ prefix: string; schemas: Record<string, RawSchema> }> = []
        const components = document['components']?.['schemas']
        if (components && typeof components === 'object') {
            sources.push({ prefix: '#/components/schemas/', schemas: components })
        }
        const definitions = document['definitions']
        if (definitions && typeof definitions === 'object') {
            sources.push({ prefix: '#/definitions/', schemas: definitions })
        }

        // Claim every name first so cross-references resolve regardless of order.
        const pending: Array<{ pointer: string; schema: RawSchema; name: string }> = []
        for (const { prefix, schemas } of sources) {
            for (const [rawName, schema] of Object.entries(schemas)) {
                if (!schema || typeof schema !== 'object') continue
                const { name } = this.registry.claim(toPascalCase(rawName) || 'Schema')
                const pointer = `${prefix}${rawName}`
                this.namedByPointer.set(pointer, name)
                pending.push({ pointer, schema, name })
            }
        }

        // Then convert bodies; nested `$ref`s now resolve to the claimed names.
        for (const { schema, name } of pending) {
            const converted = this.convertBody(schema)
            this.types.push({
                name,
                schema: converted,
                ...(typeof schema['description'] === 'string' ? { description: schema['description'] } : {}),
            })
        }
    }

    /** Follow a JSON pointer within the document. */
    private resolvePointer(pointer: string): RawSchema | undefined {
        if (!pointer.startsWith('#/')) return undefined
        let current: any = this.document
        for (const rawSegment of pointer.slice(2).split('/')) {
            const segment = rawSegment.replace(/~1/g, '/').replace(/~0/g, '~')
            if (current == null || typeof current !== 'object') return undefined
            current = current[segment]
        }
        return current && typeof current === 'object' ? current : undefined
    }

    /**
     * Convert a schema where a named reference is acceptable — a `$ref` to a
     * registered component becomes a `ref`, which is what breaks recursion.
     */
    convert(schema: RawSchema | undefined): IRSchema {
        if (!schema || typeof schema !== 'object') return { kind: 'unknown' }

        const pointer = schema['$ref']
        if (typeof pointer === 'string') {
            const name = this.namedByPointer.get(pointer)
            if (name) return { kind: 'ref', name }

            // A $ref to something we did not register (an inline path-level schema,
            // say). Expand it, guarding against self-reference.
            if (this.inProgress.has(pointer)) return { kind: 'unknown' }
            const target = this.resolvePointer(pointer)
            if (!target) {
                this.warnings.push(`Could not resolve $ref "${pointer}".`)
                return { kind: 'unknown' }
            }
            this.inProgress.add(pointer)
            try {
                return this.convertBody(target)
            } finally {
                this.inProgress.delete(pointer)
            }
        }

        return this.convertBody(schema)
    }

    /** Convert a schema's contents, ignoring whether it is itself named. */
    private convertBody(schema: RawSchema): IRSchema {
        // Composition ---------------------------------------------------------
        if (Array.isArray(schema['allOf']) && schema['allOf'].length > 0) {
            const members = schema['allOf'].map((s: RawSchema) => this.convert(s))
            return members.length === 1 ? members[0]! : { kind: 'intersection', members }
        }

        const variants = schema['oneOf'] ?? schema['anyOf']
        if (Array.isArray(variants) && variants.length > 0) {
            const members = variants.map((s: RawSchema) => this.convert(s))
            const unified: IRSchema = members.length === 1 ? members[0]! : { kind: 'union', members }
            return this.applyNullable(schema, unified)
        }

        // Enums ---------------------------------------------------------------
        if (Array.isArray(schema['enum']) && schema['enum'].length > 0) {
            const values = schema['enum'].filter(
                (v: unknown) => typeof v === 'string' || typeof v === 'number',
            ) as Array<string | number>
            if (values.length > 0) {
                return this.applyNullable(schema, { kind: 'literal', values })
            }
        }

        // OpenAPI 3.1 allows `type` to be an array, e.g. ['string', 'null'].
        const rawType = schema['type']
        const types: string[] = Array.isArray(rawType) ? rawType : typeof rawType === 'string' ? [rawType] : []
        const nullableFromType = types.includes('null')
        const type = types.filter((t) => t !== 'null')[0]

        let result: IRSchema

        switch (type) {
            case 'array':
                result = { kind: 'array', items: this.convert(schema['items']) }
                break

            case 'object':
                result = this.convertObject(schema)
                break

            case 'string':
                result = { kind: 'primitive', type: 'string' }
                break

            case 'integer':
            case 'number':
                result = { kind: 'primitive', type: 'number' }
                break

            case 'boolean':
                result = { kind: 'primitive', type: 'boolean' }
                break

            default:
                // No explicit type: infer object-ness from shape, else unknown.
                result =
                    schema['properties'] || schema['additionalProperties']
                        ? this.convertObject(schema)
                        : { kind: 'unknown' }
        }

        // OpenAPI 3.1: `type: ['string', 'null']`
        if (nullableFromType) result = this.nullify(result)

        // OpenAPI 3.0: `nullable: true`
        return this.applyNullable(schema, result)
    }

    private convertObject(schema: RawSchema): IRSchema {
        const required = new Set<string>(Array.isArray(schema['required']) ? schema['required'] : [])
        const rawProps = schema['properties']
        const properties: IRProperty[] = []

        if (rawProps && typeof rawProps === 'object') {
            for (const [key, value] of Object.entries(rawProps as Record<string, RawSchema>)) {
                properties.push({
                    name: key,
                    schema: this.convert(value),
                    required: required.has(key),
                    ...(typeof value?.['description'] === 'string' ? { description: value['description'] } : {}),
                    ...(value?.['deprecated'] === true ? { deprecated: true } : {}),
                })
            }
        }

        const additional = schema['additionalProperties']

        // A pure dictionary: no declared properties, open additionalProperties.
        if (properties.length === 0 && additional && additional !== false) {
            return {
                kind: 'record',
                value: additional === true ? { kind: 'unknown' } : this.convert(additional),
            }
        }

        if (additional && additional !== false && additional !== true) {
            return { kind: 'object', properties, additional: this.convert(additional) }
        }

        return { kind: 'object', properties }
    }

    /** OpenAPI 3.0 spells nullability as `nullable: true`. */
    private applyNullable(schema: RawSchema, inner: IRSchema): IRSchema {
        return schema['nullable'] === true ? this.nullify(inner) : inner
    }

    private nullify(inner: IRSchema): IRSchema {
        return { kind: 'union', members: [inner, { kind: 'null' }] }
    }

    /** Hoist an inline schema to a named top-level type. */
    hoist(name: string, schema: RawSchema | undefined): IRSchema {
        const converted = this.convert(schema)
        // Primitives and refs read better inline than behind an alias.
        if (converted.kind === 'ref' || converted.kind === 'unknown' || converted.kind === 'void') {
            return converted
        }
        const { name: unique } = this.registry.claim(name)
        this.types.push({ name: unique, schema: converted })
        return { kind: 'ref', name: unique }
    }

    getTypes(): NamedType[] {
        return this.types
    }

    getWarnings(): string[] {
        return this.warnings
    }
}

export { quotePropertyIfNeeded }
