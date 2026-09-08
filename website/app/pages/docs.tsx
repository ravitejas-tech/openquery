import { useState } from 'react'
import { CodeBlock } from '../components/code-block'

const sections = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'query-keys', label: 'Query Keys' },
    { id: 'pagination', label: 'Pagination' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'cli', label: 'CLI Reference' },
    { id: 'generated-files', label: 'Generated Files' },
    { id: 'edge-cases', label: 'Edge Cases' },
]

const installCode = `npm install queryfish --save-dev`

const clientAxiosCode = `// src/api/client.ts
import axios from 'axios'

// Create an axios instance with your base URL.
// You can add auth headers, interceptors, etc.
// QueryFish will use this to make all API calls.
export const client = axios.create({
  baseURL: '/api',
})`

const clientFetchCode = `// src/api/client.ts — using fetch instead of axios
interface RequestConfig {
  method: string
  url: string
  params?: Record<string, string>
  data?: unknown
}

export const client = {
  async request<T>(config: RequestConfig): Promise<T> {
    const url = new URL(config.url, 'https://api.example.com')

    // Append query parameters
    if (config.params) {
      for (const [key, val] of Object.entries(config.params)) {
        url.searchParams.set(key, val)
      }
    }

    const res = await fetch(url, {
      method: config.method,
      headers: { 'Content-Type': 'application/json' },
      body: config.data ? JSON.stringify(config.data) : undefined,
    })

    if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
    if (res.status === 204) return undefined as T
    return res.json()
  },
}`

const configCode = `// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
  // Path or URL to your OpenAPI/Swagger document.
  // This is the only required option.
  input: './openapi.yaml',

  // Where to write the generated files.
  output: './src/api',

  // Path to the file that exports your HTTP client.
  // QueryFish imports this in the generated requests.ts.
  client: './src/api/client.ts',

  // Opt in to infinite queries for specific endpoints.
  // If you don't need pagination, leave this out entirely.
  pagination: {
    '/pets': {
      param: 'cursor',      // the query param name
      nextField: 'nextCursor', // the response field for next page
    },
  },

  // Format the generated code with your Prettier config.
  // Default: true — set to false to skip formatting.
  format: true,

  // Generate a barrel index.ts that re-exports everything.
  // Default: true
  barrel: true,
})`

const generateCode = `npx queryfish generate`

const usageQueryCode = `// In any React component:
import { useListPets, useGetPet } from './api/queries'

function PetList() {
  // No need to define query keys or fetcher functions.
  // Everything is generated with full TypeScript types.
  const { data: pets, isPending, error } = useListPets()

  if (isPending) return <Spinner />
  if (error) return <Error message={error.message} />

  return (
    <ul>
      {pets.map(pet => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  )
}

function PetDetail({ petId }: { petId: string }) {
  // TypeScript ensures petId is a string —
  // pass the wrong type and it won't compile.
  const { data: pet } = useGetPet({
    variables: { petId },
  })

  return <h1>{pet?.name}</h1>
}`

const usageMutationCode = `import { useCreatePet } from './api/mutations'
import { useQueryClient } from '@tanstack/react-query'

function CreatePetButton() {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useCreatePet({
    onSuccess: () => {
      // Because query keys mirror URLs, this one call
      // invalidates /pets, /pets/{id}, etc.
      queryClient.invalidateQueries({
        queryKey: ['pets'],
      })
    },
  })

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({
        body: { name: 'Buddy', tag: 'dog' },
      })}
    >
      {isPending ? 'Creating...' : 'Add Pet'}
    </button>
  )
}`

const specExampleCode = `# A typical OpenAPI operation:
paths:
  /pets/{petId}:
    get:
      operationId: getPet
      summary: Get a pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'`

const queryKeyCode = `// After creating, updating, or deleting any pet:
queryClient.invalidateQueries({
  queryKey: ['pets'],
})

// This single call refetches:
//   /pets          → useListPets
//   /pets/{petId}  → useGetPet
//   /pets/{petId}/toys → useListPetToys
//
// With operation-name keys you'd have to list
// every affected hook by hand and update that list
// whenever an endpoint is added.`

const paginationSpecCode = `# Add this extension to any GET operation:
x-queryfish-pagination:
  param: cursor        # query parameter name
  nextField: nextCursor  # field in the response body`

const paginationConfigCode = `// Or configure it in queryfish.config.ts:
pagination: {
  '/pets': {
    param: 'cursor',
    nextField: 'nextCursor',
  },
}

// You can also disable pagination that was
// opted in via the spec extension:
pagination: {
  '/feed': false,
}`

const paginationUsageCode = `// The generated hook handles everything:
import { useListPetsInfinite } from './api/infiniteQueries'

function PetFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPetsInfinite()

  // 'cursor' is excluded from variables —
  // it comes from pageParam automatically.
  // TypeScript enforces this so you can't
  // accidentally pass it.
}`

export function DocsPage() {
    const [activeSection, setActiveSection] = useState('quick-start')

    const handleSectionClick = (id: string) => {
        setActiveSection(id)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className='min-h-screen pt-24 pb-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='lg:grid lg:grid-cols-[240px_1fr] lg:gap-10'>
                    {/* Sidebar */}
                    <aside className='hidden lg:block'>
                        <div className='sticky top-24'>
                            <h3 className='mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted'>
                                On this page
                            </h3>
                            <nav className='space-y-1'>
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSectionClick(s.id)}
                                        className={`docs-sidebar-link w-full text-left ${activeSection === s.id ? 'active' : ''}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className='prose-ocean min-w-0'>
                        <h1 className='mb-2 text-4xl font-extrabold text-text-primary'>Documentation</h1>
                        <p className='mb-12 text-lg text-text-secondary'>
                            Everything you need to go from an OpenAPI spec to type-safe React Query hooks in your app.
                        </p>

                        {/* ─── Quick Start ─── */}
                        <section id='quick-start'>
                            <h2>Quick Start</h2>
                            <p>
                                QueryFish is a code generator that reads your OpenAPI document and writes TypeScript files
                                containing React Query hooks. You install it as a <strong>dev dependency</strong> — it
                                produces code at build time, not at runtime.
                            </p>

                            <h3>1. Install QueryFish</h3>
                            <p>Add it to your project as a dev dependency. Nothing from QueryFish ends up in your production bundle.</p>
                            <CodeBlock
                                code={installCode}
                                language='bash'
                                title='Terminal'
                            />

                            <h3>2. Create your HTTP client</h3>
                            <p>
                                QueryFish does <strong>not</strong> ship its own HTTP client. Instead, you write a small
                                wrapper around whatever library you already use (axios, fetch, ky, etc.). This keeps you
                                in full control of authentication, interceptors, base URLs, and error handling.
                            </p>
                            <p>Here are two examples — pick whichever fits your stack:</p>

                            <h3>Option A: Axios</h3>
                            <CodeBlock
                                code={clientAxiosCode}
                                title='src/api/client.ts — Axios'
                            />

                            <h3>Option B: Fetch</h3>
                            <CodeBlock
                                code={clientFetchCode}
                                title='src/api/client.ts — Fetch'
                            />

                            <div className='callout-tip'>
                                <p>
                                    <strong>💡 Tip:</strong> Your client just needs to export a <code>client</code> object
                                    with a <code>request&lt;T&gt;(config)</code> method. The config has <code>method</code>,{' '}
                                    <code>url</code>, <code>params</code> (query string), and <code>data</code> (body).
                                </p>
                            </div>

                            <h3>3. Add a config file</h3>
                            <p>
                                Create a <code>queryfish.config.ts</code> in your project root. At minimum, you need three
                                things: where the spec is, where to write output, and where your client lives.
                            </p>
                            <CodeBlock
                                code={configCode}
                                title='queryfish.config.ts'
                            />
                            <p>
                                Config files can be <code>.ts</code>, <code>.mts</code>, <code>.js</code>,{' '}
                                <code>.mjs</code>, or <code>.json</code> — use whatever fits your project.
                            </p>

                            <h3>4. Run the generator</h3>
                            <p>One command reads your spec and writes the output files:</p>
                            <CodeBlock
                                code={generateCode}
                                language='bash'
                                title='Terminal'
                            />
                            <p>
                                You&apos;ll see a summary of which files were created or updated. The generated code is
                                formatted with <strong>your</strong> Prettier config, so it looks like the rest of your
                                codebase.
                            </p>

                            <h3>5. Use the generated hooks</h3>
                            <p>
                                Import the hooks directly in your components. TypeScript gives you full autocomplete and
                                catches type errors at compile time — not at runtime.
                            </p>
                            <CodeBlock
                                code={usageQueryCode}
                                title='Using query hooks'
                            />

                            <h3>6. Use generated mutations</h3>
                            <p>
                                Mutations work the same way. The generated hooks wrap <code>react-query-kit</code>&apos;s{' '}
                                <code>createMutation</code>, so you get all the standard React Query options like{' '}
                                <code>onSuccess</code>, <code>onError</code>, and <code>onSettled</code>.
                            </p>
                            <CodeBlock
                                code={usageMutationCode}
                                title='Using mutation hooks'
                            />
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── How It Works ─── */}
                        <section id='how-it-works'>
                            <h2>How It Works</h2>
                            <p>
                                QueryFish reads your OpenAPI document and runs it through a four-stage pipeline:
                            </p>
                            <ul>
                                <li>
                                    <strong>Load</strong> — Reads and bundles the spec, resolving all <code>$ref</code>{' '}
                                    references. Supports local files, URLs, YAML, and JSON.
                                </li>
                                <li>
                                    <strong>Build IR</strong> — Converts the spec into an intermediate representation that
                                    normalizes differences between OpenAPI 3.0, 3.1, and Swagger 2.0.
                                </li>
                                <li>
                                    <strong>Emit</strong> — Generates TypeScript source files from the IR:{' '}
                                    <code>types.ts</code>, <code>requests.ts</code>, <code>queries.ts</code>,{' '}
                                    <code>mutations.ts</code>, and optionally <code>infiniteQueries.ts</code>.
                                </li>
                                <li>
                                    <strong>Format</strong> — Runs Prettier on the output so it matches your project&apos;s
                                    style. Skippable with <code>--no-format</code>.
                                </li>
                            </ul>

                            <p>Here&apos;s what a single endpoint in your spec looks like:</p>
                            <CodeBlock
                                code={specExampleCode}
                                language='yaml'
                                title='openapi.yaml'
                            />
                            <p>
                                From this, QueryFish generates a <code>GetPetVariables</code> type (with <code>petId: string</code>),
                                a <code>GetPetResponse</code> type (the <code>Pet</code> interface), a <code>getPet</code>{' '}
                                request function, and a <code>useGetPet</code> query hook — all fully typed.
                            </p>
                            <p>
                                Your spec&apos;s <code>summary</code> field becomes JSDoc on the generated hook, so you see
                                the description when you hover over it in your editor.
                            </p>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Query Keys ─── */}
                        <section id='query-keys'>
                            <h2>Query Keys</h2>
                            <p>
                                This is the detail that pays off daily. Most generators use operation names as query keys
                                (e.g., <code>[&apos;getPet&apos;]</code>). QueryFish uses <strong>URL path segments</strong>{' '}
                                instead (e.g., <code>[&apos;pets&apos;, &apos;&#123;petId&#125;&apos;]</code>).
                            </p>
                            <p>
                                Why does this matter? Because React Query matches keys hierarchically. When you invalidate{' '}
                                <code>[&apos;pets&apos;]</code>, it refetches every query whose key <em>starts with</em>{' '}
                                <code>[&apos;pets&apos;]</code> — which is exactly the queries that hit <code>/pets/*</code>{' '}
                                endpoints:
                            </p>
                            <CodeBlock
                                code={queryKeyCode}
                                title='Cache invalidation'
                            />

                            <div className='callout-tip'>
                                <p>
                                    <strong>💡 Why this is better:</strong> With operation-name keys, you&apos;d need to
                                    manually list every affected hook when invalidating. And you&apos;d need to update that
                                    list every time you add a new endpoint. URL-based keys do this automatically.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Pagination ─── */}
                        <section id='pagination'>
                            <h2>Pagination (Infinite Queries)</h2>
                            <p>
                                OpenAPI has <strong>no standard for pagination</strong>. Every API does it differently —
                                cursor-based, offset-based, page-number-based. Generators that try to guess produce a hook
                                that type-checks and looks right but silently fetches the same page forever.
                            </p>
                            <p>
                                QueryFish takes a different approach: <strong>you explicitly opt in</strong> to infinite
                                queries by telling it which parameter is the cursor and which response field contains the
                                next page token.
                            </p>

                            <h3>Opt in via the spec</h3>
                            <p>Add an <code>x-queryfish-pagination</code> extension to any GET operation:</p>
                            <CodeBlock
                                code={paginationSpecCode}
                                language='yaml'
                                title='OpenAPI spec extension'
                            />

                            <h3>Opt in via config</h3>
                            <p>Or specify it in your config file. This is useful when you can&apos;t modify the spec:</p>
                            <CodeBlock
                                code={paginationConfigCode}
                                title='queryfish.config.ts'
                            />

                            <h3>Using the generated hook</h3>
                            <p>
                                The generated <code>useListPetsInfinite</code> hook handles the cursor automatically. The
                                cursor parameter is excluded from your variables type so you can&apos;t accidentally pass it:
                            </p>
                            <CodeBlock
                                code={paginationUsageCode}
                                title='Using infinite query hooks'
                            />

                            <div className='callout-tip'>
                                <p>
                                    <strong>💡 No pagination needed?</strong> If none of your endpoints need infinite
                                    queries, simply don&apos;t add any pagination config. The <code>infiniteQueries.ts</code>{' '}
                                    file won&apos;t be generated at all.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Configuration ─── */}
                        <section id='configuration'>
                            <h2>Configuration Reference</h2>
                            <p>
                                All configuration goes in a <code>queryfish.config.ts</code> file at your project root.
                                Here&apos;s every option with its type, default, and what it does:
                            </p>

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>Option</th>
                                        <th>Type</th>
                                        <th>Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>input</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <em>required</em>
                                        </td>
                                        <td>
                                            Path or URL to your OpenAPI document. Supports YAML, JSON, OpenAPI 3.0, 3.1,
                                            and Swagger 2.0.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>output</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <em>required</em>
                                        </td>
                                        <td>
                                            Directory where generated files will be written. Created automatically if it
                                            doesn&apos;t exist.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>client</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <code>&apos;./client&apos;</code>
                                        </td>
                                        <td>
                                            Module that exports your HTTP client. Can be a relative path (resolved from
                                            project root) or a package specifier like <code>@/lib/api</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>pagination</code>
                                        </td>
                                        <td>object</td>
                                        <td>
                                            <code>undefined</code>
                                        </td>
                                        <td>
                                            Map of path → pagination config. Set a path to <code>false</code> to suppress
                                            pagination that was opted in via the spec extension.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>format</code>
                                        </td>
                                        <td>boolean</td>
                                        <td>
                                            <code>true</code>
                                        </td>
                                        <td>
                                            Run Prettier on the generated output using your project&apos;s{' '}
                                            <code>.prettierrc</code>. Disable with <code>false</code> or the{' '}
                                            <code>--no-format</code> CLI flag.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>barrel</code>
                                        </td>
                                        <td>boolean</td>
                                        <td>
                                            <code>true</code>
                                        </td>
                                        <td>
                                            Generate an <code>index.ts</code> that re-exports everything from the other
                                            files. Useful for <code>import &#123; ... &#125; from &apos;./api&apos;</code>.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── CLI ─── */}
                        <section id='cli'>
                            <h2>CLI Reference</h2>
                            <p>
                                The CLI is the primary way to run QueryFish. All options can also be set in the config
                                file — CLI flags take precedence when both are specified.
                            </p>
                            <CodeBlock
                                code='npx queryfish generate [options]'
                                language='bash'
                                title='Terminal'
                            />

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>Flag</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>-c, --config &lt;path&gt;</code>
                                        </td>
                                        <td>
                                            Path to a config file. Defaults to <code>queryfish.config.ts</code> in your
                                            project root.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>-i, --input &lt;spec&gt;</code>
                                        </td>
                                        <td>
                                            Path or URL to your OpenAPI document. Overrides the config file&apos;s{' '}
                                            <code>input</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>-o, --output &lt;dir&gt;</code>
                                        </td>
                                        <td>
                                            Output directory. Overrides the config file&apos;s <code>output</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--client &lt;module&gt;</code>
                                        </td>
                                        <td>
                                            Module exporting your HTTP client. Overrides the config file&apos;s{' '}
                                            <code>client</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--dry-run</code>
                                        </td>
                                        <td>
                                            Show what files would be created or changed, but don&apos;t write anything to
                                            disk. Useful for CI checks.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--watch</code>
                                        </td>
                                        <td>
                                            Watch the spec file for changes and regenerate automatically. Great for
                                            development.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--no-format</code>
                                        </td>
                                        <td>Skip Prettier formatting. Useful if Prettier isn&apos;t set up in your project.</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--silent</code>
                                        </td>
                                        <td>Suppress all output except errors.</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h3>Error messages</h3>
                            <p>
                                When something goes wrong, QueryFish points at the exact location in your spec so you
                                know where to look:
                            </p>
                            <CodeBlock
                                code={`error: cannot resolve schema
  at paths./pets.get.responses.200
  in openapi.yaml:42

  Check that the $ref target exists
  in components.schemas.`}
                                language='text'
                                title='Error output'
                                showCopy={false}
                            />
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Generated Files ─── */}
                        <section id='generated-files'>
                            <h2>What Gets Generated</h2>
                            <p>
                                QueryFish generates up to six files. Each file has a single responsibility, and
                                they&apos;re designed to be committed to your repo and reviewed in pull requests:
                            </p>
                            <CodeBlock
                                code={`src/api/
├── types.ts           # TypeScript interfaces and type aliases
├── requests.ts        # Plain async functions (usable without React)
├── queries.ts         # createQuery hook factories (GET, HEAD)
├── mutations.ts       # createMutation hook factories (POST, PUT, PATCH, DELETE)
├── infiniteQueries.ts # createInfiniteQuery factories (only if opted in)
└── index.ts           # Barrel file that re-exports everything`}
                                language='text'
                                title='Output structure'
                                showCopy={false}
                            />

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>File</th>
                                        <th>What it contains</th>
                                        <th>When you&apos;d import it</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>types.ts</code>
                                        </td>
                                        <td>Interfaces from your schemas, plus Variables and Response types for each operation</td>
                                        <td>When you need to type a prop or function parameter</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>requests.ts</code>
                                        </td>
                                        <td>Standalone async functions that call your client — no React dependency</td>
                                        <td>In server-side code, scripts, or tests</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>queries.ts</code>
                                        </td>
                                        <td>
                                            <code>useX</code> hooks created with <code>createQuery</code> from react-query-kit
                                        </td>
                                        <td>In React components for GET requests</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>mutations.ts</code>
                                        </td>
                                        <td>
                                            <code>useX</code> hooks created with <code>createMutation</code>
                                        </td>
                                        <td>In React components for POST/PUT/PATCH/DELETE</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>infiniteQueries.ts</code>
                                        </td>
                                        <td>
                                            <code>useXInfinite</code> hooks for paginated endpoints
                                        </td>
                                        <td>Only created if you opt in to pagination</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>index.ts</code>
                                        </td>
                                        <td>Re-exports from all other files</td>
                                        <td>
                                            Convenience: <code>import &#123; ... &#125; from &apos;./api&apos;</code>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className='callout-tip'>
                                <p>
                                    <strong>💡 Commit the generated code.</strong> It&apos;s meant to be reviewed in PRs.
                                    The output is formatted with your Prettier config and uses readable variable names,
                                    so reviewers can see exactly what changed when the spec is updated.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Edge Cases ─── */}
                        <section id='edge-cases'>
                            <h2>Specs It Handles</h2>
                            <p>
                                Real-world OpenAPI specs are messy. They have recursive schemas, missing fields,
                                duplicate names, and reserved words. QueryFish handles all of these — each case has a
                                regression test to make sure it never breaks:
                            </p>
                            <table className='docs-table mt-4'>
                                <thead>
                                    <tr>
                                        <th>Edge case</th>
                                        <th>What QueryFish does</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong>Recursive schemas</strong>
                                        </td>
                                        <td>
                                            Emits named references instead of inlining. <code>Comment.replies: Comment[]</code>{' '}
                                            works correctly, including mutually recursive types.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Missing <code>operationId</code></strong>
                                        </td>
                                        <td>
                                            Derives a name from the HTTP method + path. For example, <code>GET /pets/&#123;petId&#125;/toys</code>{' '}
                                            becomes <code>getPetsByPetIdToys</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Duplicate <code>operationId</code></strong>
                                        </td>
                                        <td>
                                            Appends a numeric suffix (<code>duplicated</code>, <code>duplicated2</code>) and
                                            prints a warning so you can fix the spec.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Reserved words</strong>
                                        </td>
                                        <td>
                                            An operation named <code>delete</code> becomes <code>delete_</code> to avoid
                                            conflicts with JavaScript keywords.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Odd parameter names</strong>
                                        </td>
                                        <td>
                                            Names like <code>filter[status]</code> and <code>X-Request-Id</code> are
                                            properly quoted in the generated types.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Schema composition</strong>
                                        </td>
                                        <td>
                                            <code>allOf</code> → TypeScript intersection (<code>&amp;</code>),{' '}
                                            <code>oneOf</code>/<code>anyOf</code> → union (<code>|</code>).
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Nullability</strong>
                                        </td>
                                        <td>
                                            Handles both OpenAPI 3.0&apos;s <code>nullable: true</code> and 3.1&apos;s{' '}
                                            <code>type: [&apos;string&apos;, &apos;null&apos;]</code> correctly.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Empty responses</strong>
                                        </td>
                                        <td>
                                            A <code>204 No Content</code> response maps to <code>void</code>, not an empty
                                            object.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Swagger 2.0</strong>
                                        </td>
                                        <td>
                                            Supports the older <code>definitions</code> key, <code>in: body</code>{' '}
                                            parameters, and response schemas.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    )
}
