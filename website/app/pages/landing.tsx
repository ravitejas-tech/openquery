import { Link } from 'react-router'
import { CodeBlock, InstallSnippet } from '../components/code-block'

const features = [
    {
        icon: '🎯',
        title: 'Never Guesses',
        description:
            'Where OpenAPI has no standard — pagination, notably — QueryFish requires an explicit opt-in instead of inferring. A wrong guess that compiles is worse than no feature.',
    },
    {
        icon: '🔑',
        title: 'Smart Query Keys',
        description:
            'Query keys mirror your URLs, so one call invalidates a whole resource tree instead of a single endpoint. No manual key management.',
    },
    {
        icon: '🪶',
        title: 'Zero Runtime',
        description:
            'QueryFish is a devDependency. Nothing it publishes ends up in your bundle. Pure codegen, pure types.',
    },
    {
        icon: '✅',
        title: 'Verified Output',
        description:
            'Generated code is verified to compile — not assumed to. CI type-checks output against the real react-query-kit on every run.',
    },
    {
        icon: '🧬',
        title: 'Handles Real Specs',
        description:
            'Recursive schemas, duplicate operationIds, reserved words, allOf/oneOf, Swagger 2.0 — all covered with regression tests.',
    },
    {
        icon: '⚡',
        title: 'Watch Mode',
        description:
            'Change your spec, see regenerated hooks instantly. Works with local files and supports your existing Prettier config.',
    },
]

const beforeCode = `const { data } = useQuery({
  queryKey: ['pet', petId],
  queryFn: () =>
    fetch(\`/api/pets/\${petId}\`)
      .then(r => r.json()),
})
// data: any — and the key is
// whatever you remembered to type`

const afterCode = `const { data } = useGetPet({
  variables: { petId },
})
// data: Pet — fully typed
// petId is required,
// typos don't compile`

const configCode = `// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  client: './src/api/client.ts',
})`

const generatedOutput = `src/api/
├── types.ts           # Interfaces & types
├── requests.ts        # Plain async functions
├── queries.ts         # createQuery hooks
├── mutations.ts       # createMutation hooks
├── infiniteQueries.ts # opt-in infinite queries
└── index.ts           # Barrel re-export`

export function Landing() {
    return (
        <div className='min-h-screen'>
            {/* ═══ Hero ═══ */}
            <section className='relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28'>
                <div className='hero-mesh' />
                <div className='relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8'>
                    <div className='animate-fade-in-up'>
                        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-sm text-brand-sky'>
                            <span className='inline-block h-2 w-2 animate-pulse rounded-full bg-brand-sky' />
                            Open Source — MIT Licensed
                        </div>
                    </div>

                    <h1 className='animate-fade-in-up-delay-1 mb-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl lg:text-7xl'>
                        <span className='text-text-primary'>Hook your API.</span>
                        <br />
                        <span className='gradient-text'>Typed, straight from the spec.</span>
                    </h1>

                    <p className='animate-fade-in-up-delay-2 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl'>
                        Turn an OpenAPI document into fully typed{' '}
                        <a
                            href='https://tanstack.com/query'
                            className='text-brand-sky no-underline hover:underline'>
                            React Query
                        </a>{' '}
                        hooks powered by{' '}
                        <a
                            href='https://github.com/HuolalaTech/react-query-kit'
                            className='text-brand-sky no-underline hover:underline'>
                            react-query-kit
                        </a>{' '}
                        — with zero runtime and no hand-written client code.
                    </p>

                    <div className='animate-fade-in-up-delay-3 mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                        <Link
                            to='/docs'
                            className='btn-primary'>
                            Get Started
                            <span>→</span>
                        </Link>
                        <a
                            href='https://github.com/ravitejas-tech/queryfish'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-secondary'>
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='currentColor'>
                                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                            </svg>
                            View on GitHub
                        </a>
                    </div>

                    <div className='animate-fade-in-up-delay-4'>
                        <InstallSnippet />
                    </div>
                </div>
            </section>

            {/* ═══ Code Comparison — Fix #5: more polished UI ═══ */}
            <section className='relative py-24'>
                <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>
                            Before & After
                        </p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            From <span className='text-text-muted line-through decoration-text-muted/40'>guesswork</span>{' '}
                            to <span className='gradient-text'>type safety</span>
                        </h2>
                        <p className='mx-auto max-w-2xl text-text-secondary'>
                            Stop writing fetch functions, TypeScript types, and React Query hooks by hand. Describe your
                            API once in OpenAPI — QueryFish generates the rest.
                        </p>
                    </div>

                    <div className='grid gap-6 md:grid-cols-2 items-stretch'>
                        {/* Before card */}
                        <div className='comparison-card h-full'>
                            <div className='flex h-full flex-col rounded-2xl bg-gradient-to-br from-red-500/5 to-transparent p-1'>
                                <div className='flex h-full flex-1 flex-col rounded-xl bg-ocean-900/80'>
                                    <div className='flex items-center gap-2 border-b border-white/5 px-5 py-3'>
                                        <span className='inline-block h-2.5 w-2.5 rounded-full bg-red-400/60' />
                                        <span className='text-sm font-medium text-red-400/80'>
                                            Before — manual, untyped
                                        </span>
                                    </div>
                                    <div className='flex flex-1 flex-col justify-between p-5'>
                                        <pre className='overflow-x-auto font-mono text-sm leading-relaxed text-text-secondary'>
                                            <code>{beforeCode}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* After card */}
                        <div className='comparison-card h-full'>
                            <div className='flex h-full flex-col rounded-2xl bg-gradient-to-br from-emerald-500/5 to-brand-blue/5 p-1'>
                                <div className='flex h-full flex-1 flex-col rounded-xl bg-ocean-900/80'>
                                    <div className='flex items-center gap-2 border-b border-white/5 px-5 py-3'>
                                        <span className='inline-block h-2.5 w-2.5 rounded-full bg-emerald-400/60' />
                                        <span className='text-sm font-medium text-emerald-400/80'>
                                            After — generated, type-safe
                                        </span>
                                    </div>
                                    <div className='flex flex-1 flex-col justify-between p-5'>
                                        <pre className='overflow-x-auto font-mono text-sm leading-relaxed text-text-secondary'>
                                            <code>{afterCode}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom stats */}
                    <div className='mt-10 grid grid-cols-3 gap-4'>
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-brand-sky'>0</p>
                            <p className='text-xs text-text-muted'>Runtime overhead</p>
                        </div>
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-brand-sky'>100%</p>
                            <p className='text-xs text-text-muted'>Type coverage</p>
                        </div>
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-brand-sky'>1 cmd</p>
                            <p className='text-xs text-text-muted'>To generate</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ Features ═══ */}
            <section className='py-20'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>Features</p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            Why <span className='gradient-text'>QueryFish</span>?
                        </h2>
                        <p className='mx-auto max-w-xl text-text-secondary'>
                            Built for teams who&apos;d rather write features than fetch functions.
                        </p>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className='glass-card p-6'>
                                <div className='mb-4 text-3xl'>{feature.icon}</div>
                                <h3 className='mb-2 text-lg font-semibold text-text-primary'>{feature.title}</h3>
                                <p className='text-sm leading-relaxed text-text-secondary'>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ How it works ═══ */}
            <section className='py-20'>
                <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>
                            How It Works
                        </p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            Three steps to <span className='gradient-text'>type-safe hooks</span>
                        </h2>
                    </div>

                    <div className='grid gap-8 lg:grid-cols-2'>
                        <div className='space-y-8'>
                            <Step
                                number='01'
                                title='Configure'
                                description='Point QueryFish at your OpenAPI spec and tell it where your HTTP client lives.'
                            />
                            <Step
                                number='02'
                                title='Generate'
                                description='Run one command. QueryFish reads your spec, builds an IR, and emits readable TypeScript.'
                            />
                            <Step
                                number='03'
                                title='Use'
                                description='Import the generated hooks in your components. Full autocomplete, type-safe variables, smart query keys.'
                            />
                        </div>
                        <div className='space-y-6'>
                            <CodeBlock
                                code={configCode}
                                title='queryfish.config.ts'
                            />
                            <CodeBlock
                                code={generatedOutput}
                                title='Generated output'
                                language='text'
                                showCopy={false}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ CTA ═══ */}
            <section className='relative py-24'>
                <div className='hero-mesh' />
                <div className='relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8'>
                    <h2 className='mb-6 text-3xl font-bold text-text-primary sm:text-4xl'>
                        Ready to <span className='gradient-text'>stop hand-writing hooks</span>?
                    </h2>
                    <p className='mb-10 text-lg text-text-secondary'>
                        Get started in under a minute. QueryFish is free, open source, and MIT licensed.
                    </p>
                    <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
                        <Link
                            to='/docs'
                            className='btn-primary'>
                            Read the Docs
                            <span>→</span>
                        </Link>
                        <Link
                            to='/examples'
                            className='btn-secondary'>
                            See Examples
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className='flex gap-5'>
            <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-brand-blue/20 bg-brand-blue/5 font-mono text-sm font-bold text-brand-sky'>
                {number}
            </div>
            <div>
                <h3 className='mb-1 text-lg font-semibold text-text-primary'>{title}</h3>
                <p className='text-sm leading-relaxed text-text-secondary'>{description}</p>
            </div>
        </div>
    )
}
