/** Public configuration surface. */

export interface PaginationConfig {
    /** Query parameter carrying the cursor/page value. Excluded from variables. */
    param: string
    /** Field in the response holding the next cursor, e.g. `nextCursor`. */
    nextField: string
    /** Initial `pageParam` value. Defaults to `null`. */
    initialPageParam?: string | number | null
}

export interface QueryFishConfig {
    /** Path or URL to the OpenAPI/Swagger document. */
    input: string

    /** Directory to write generated files into. */
    output: string

    /**
     * Module exporting the HTTP `client` used by generated request functions.
     * Resolved relative to the project root; imported by `requests.ts`.
     *
     * QueryFish ships no runtime — auth, interceptors, and base URLs stay in your
     * code. Any object with a `request({ method, url, params, data, headers })`
     * method works (axios, a fetch wrapper, ky, …).
     *
     * @default './client'
     */
    client?: string

    /**
     * Opt in to infinite queries, keyed by path.
     *
     * OpenAPI has no pagination standard, so QueryFish never guesses: with no
     * entry here (and no `x-queryfish-pagination` in the spec) an endpoint is
     * emitted as a plain query. Set to `false` to suppress a spec-level opt-in.
     *
     * @example
     * pagination: { '/users': { param: 'cursor', nextField: 'nextCursor' } }
     */
    pagination?: Record<string, PaginationConfig | false>

    /** Format generated output with Prettier, using your project config. @default true */
    format?: boolean

    /** Emit a barrel `index.ts` re-exporting everything. @default true */
    barrel?: boolean
}

/** Identity helper that provides type-checking and autocomplete in config files. */
export function defineConfig(config: QueryFishConfig): QueryFishConfig {
    return config
}

export type ResolvedConfig = Required<Omit<QueryFishConfig, 'pagination'>> & Pick<QueryFishConfig, 'pagination'>

export const CONFIG_DEFAULTS = {
    client: './client',
    format: true,
    barrel: true,
} satisfies Partial<QueryFishConfig>
