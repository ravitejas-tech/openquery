import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { generate } from '../src/generate.js'
import { loadSpec } from '../src/loader/load.js'
import { buildIR } from '../src/ir/build.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(here, 'fixtures')

/** Generate without touching disk. */
async function run(spec: string, overrides: Record<string, unknown> = {}) {
    return generate({
        input: path.join(fixtures, spec),
        output: path.join(here, '.out', spec.replace(/\W/g, '_')),
        client: './client',
        root: here,
        dryRun: true,
        ...overrides,
    })
}

function fileNamed(result: Awaited<ReturnType<typeof run>>, name: string): string | undefined {
    return result.files.find((f) => f.name === name)?.contents
}

describe('petstore', () => {
    it('generates the expected files', async () => {
        const result = await run('petstore.yaml')
        expect(result.files.map((f) => f.name).sort()).toEqual([
            'index.ts',
            'mutations.ts',
            'queries.ts',
            'requests.ts',
            'types.ts',
        ])
    })

    it('matches the snapshot', async () => {
        const result = await run('petstore.yaml')
        for (const file of result.files) {
            expect(file.contents).toMatchSnapshot(file.name)
        }
    })

    it('uses path segments as the query key', async () => {
        const queries = fileNamed(await run('petstore.yaml'), 'queries.ts')!
        // Enables queryClient.invalidateQueries({ queryKey: ['pets'] }).
        // Quote style follows the *user's* Prettier config, so match either.
        expect(queries).toMatch(/queryKey: \['pets'\]|queryKey: \["pets"\]/)
        expect(/queryKey: \['pets', '\{petId\}'\]|queryKey: \["pets", "\{petId\}"\]/.test(queries)).toBe(true)
    })

    it('splits queries and mutations by method', async () => {
        const result = await run('petstore.yaml')
        const queries = fileNamed(result, 'queries.ts')!
        const mutations = fileNamed(result, 'mutations.ts')!

        expect(queries).toContain('useListPets')
        expect(queries).toContain('useGetPet')
        expect(mutations).toContain('useCreatePet')
        expect(mutations).toContain('useDeletePet')
        expect(queries).not.toContain('useCreatePet')
    })

    it('imports the client, resolved relative to the output directory', async () => {
        // `client: './client'` is relative to the project root, so from a nested
        // output directory it must be rewritten to reach back out.
        const requests = fileNamed(await run('petstore.yaml'), 'requests.ts')!
        expect(requests).toMatch(/import \{ client \} from ['"]\.\.\/\.\.\/client['"]/)
    })

    it('passes bare client specifiers through untouched', async () => {
        const requests = fileNamed(await run('petstore.yaml', { client: '@/lib/api-client' }), 'requests.ts')!
        expect(requests).toMatch(/import \{ client \} from ['"]@\/lib\/api-client['"]/)
    })

    it('interpolates path parameters', async () => {
        const requests = fileNamed(await run('petstore.yaml'), 'requests.ts')!
        expect(requests).toContain('`/pets/${variables.petId}`')
    })

    it('emits void for 204 responses', async () => {
        const types = fileNamed(await run('petstore.yaml'), 'types.ts')!
        expect(types).toContain('export type DeletePetResponse = void')
    })
})

describe('edge cases', () => {
    it('does not hang on circular references', async () => {
        // Dereferencing produces genuinely circular objects; a naive walk never
        // returns. Reaching the assertion at all is the point of this test.
        const result = await run('edge-cases.yaml')
        expect(result.operationCount).toBeGreaterThan(0)
    })

    it('emits self-referential types by name', async () => {
        const types = fileNamed(await run('edge-cases.yaml'), 'types.ts')!
        expect(types).toContain('export interface Comment')
        // The recursive property refers to the named type rather than inlining it.
        expect(types).toMatch(/replies\?: Comment\[\]/)
    })

    it('handles mutually recursive types', async () => {
        const types = fileNamed(await run('edge-cases.yaml'), 'types.ts')!
        expect(types).toContain('export interface Node')
        expect(types).toContain('export interface Edge')
        expect(types).toMatch(/edge\?: Edge/)
        expect(types).toMatch(/node\?: Node/)
    })

    it('derives missing operationIds', async () => {
        const result = await run('edge-cases.yaml')
        const requests = fileNamed(result, 'requests.ts')!
        expect(requests).toContain('getWidgetsByWidgetIdParts')
    })

    it('suffixes duplicate operationIds and warns', async () => {
        const result = await run('edge-cases.yaml')
        const requests = fileNamed(result, 'requests.ts')!
        expect(requests).toContain('export const duplicated =')
        expect(requests).toContain('export const duplicated2 =')
        expect(result.warnings.some((w) => w.includes('Duplicate operation name'))).toBe(true)
    })

    it('escapes reserved words', async () => {
        const requests = fileNamed(await run('edge-cases.yaml'), 'requests.ts')!
        expect(requests).toContain('export const delete_ =')
    })

    it('quotes property names that are not identifiers', async () => {
        const types = fileNamed(await run('edge-cases.yaml'), 'types.ts')!
        expect(types).toMatch(/['"]filter\[status\]['"]/)
        expect(types).toMatch(/['"]X-Request-Id['"]/)
    })

    it('matches the snapshot', async () => {
        const result = await run('edge-cases.yaml')
        for (const file of result.files) {
            expect(file.contents).toMatchSnapshot(file.name)
        }
    })
})

describe('pagination', () => {
    it('is off unless opted in', async () => {
        // Petstore declares no pagination, so the file must not exist at all.
        const result = await run('petstore.yaml')
        expect(result.files.map((f) => f.name)).not.toContain('infiniteQueries.ts')
    })

    it('honours an x-queryfish-pagination extension', async () => {
        const result = await run('edge-cases.yaml')
        const infinite = fileNamed(result, 'infiniteQueries.ts')
        expect(infinite).toBeDefined()
        expect(infinite).toContain('useListFeedInfinite')
        expect(infinite).toContain('getNextPageParam')
        expect(infinite).toContain('initialPageParam')
    })

    it('excludes the cursor from the hook variables', async () => {
        const infinite = fileNamed(await run('edge-cases.yaml'), 'infiniteQueries.ts')!
        // The cursor comes from pageParam, so callers must not be able to set it —
        // while the underlying request function still accepts it.
        expect(infinite).toMatch(/Omit<ListFeedVariables, ['"]cursor['"]>/)
    })

    it('types the page param from the cursor schema', async () => {
        const infinite = fileNamed(await run('edge-cases.yaml'), 'infiniteQueries.ts')!
        // `cursor` is declared as a string in the spec.
        expect(infinite).toContain('string | undefined')
    })

    it('can be suppressed from config', async () => {
        const result = await run('edge-cases.yaml', {
            pagination: { '/feed': false },
        })
        expect(result.files.map((f) => f.name)).not.toContain('infiniteQueries.ts')
    })

    it('can be opted in from config alone', async () => {
        const result = await run('petstore.yaml', {
            pagination: { '/pets': { param: 'limit', nextField: 'next' } },
        })
        const infinite = fileNamed(result, 'infiniteQueries.ts')
        expect(infinite).toContain('useListPetsInfinite')
    })
})

describe('swagger 2.0', () => {
    it('loads and generates', async () => {
        const result = await run('swagger2.json')
        expect(result.operationCount).toBe(3)
        expect(fileNamed(result, 'queries.ts')).toContain('useListBooks')
        expect(fileNamed(result, 'mutations.ts')).toContain('useCreateBook')
    })
})

describe('IR', () => {
    it('classifies operations by method', async () => {
        const { document } = await loadSpec(path.join(fixtures, 'petstore.yaml'), here)
        const ir = buildIR(document, { input: '', output: '' })

        const kinds = Object.fromEntries(ir.operations.map((o) => [o.operationId, o.kind]))
        expect(kinds['listPets']).toBe('query')
        expect(kinds['getPet']).toBe('query')
        expect(kinds['createPet']).toBe('mutation')
        expect(kinds['updatePet']).toBe('mutation')
        expect(kinds['deletePet']).toBe('mutation')
    })

    it('marks path parameters required regardless of the spec', async () => {
        const { document } = await loadSpec(path.join(fixtures, 'petstore.yaml'), here)
        const ir = buildIR(document, { input: '', output: '' })
        const getPet = ir.operations.find((o) => o.operationId === 'getPet')!
        expect(getPet.pathParams.every((p) => p.required)).toBe(true)
    })
})

describe('dry run', () => {
    it('reports status without writing', async () => {
        const result = await run('petstore.yaml')
        // Nothing exists at the output path, so every file reads as new.
        expect(result.files.every((f) => f.status === 'created')).toBe(true)
    })
})
