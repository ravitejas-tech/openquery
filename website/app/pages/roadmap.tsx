import { Link } from 'react-router'

const completed = [
    {
        title: 'createQuery and createMutation factories',
        description: 'Generate type-safe query and mutation hooks from GET, POST, PUT, PATCH, DELETE operations.',
    },
    {
        title: 'createInfiniteQuery (opt-in)',
        description: 'Infinite scroll / pagination hooks with explicit opt-in — no guessing.',
    },
    {
        title: 'Custom axios / fetch client support',
        description: 'Bring your own HTTP client. QueryFish generates the glue code.',
    },
    {
        title: 'Watch mode',
        description: 'Change your spec, see regenerated hooks instantly.',
    },
    {
        title: 'OpenAPI 3.0, 3.1, and Swagger 2.0',
        description: 'Full support for all major spec versions.',
    },
]

const upcoming = [
    {
        title: 'Zod schema generation',
        description: 'Runtime validation schemas generated alongside your types for full stack type safety.',
        tag: 'Up Next',
    },
    {
        title: 'MSW mock handler generation',
        description: 'Auto-generate Mock Service Worker handlers from your spec for testing.',
        tag: 'Planned',
    },
    {
        title: 'Suspense query variants',
        description: 'useSuspenseQuery wrappers for React Suspense-first architectures.',
        tag: 'Planned',
    },
    {
        title: 'Plugin system',
        description: 'Custom emitters and output formats via a plugin API.',
        tag: 'Exploring',
    },
]

export function RoadmapPage() {
    return (
        <div className='min-h-screen pt-24 pb-16'>
            <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
                <div className='mb-16'>
                    <h1 className='mb-4 text-4xl font-extrabold text-text-primary'>Roadmap</h1>
                    <p className='max-w-2xl text-lg text-text-secondary'>
                        What&apos;s shipped, what&apos;s next, and where we&apos;re headed. Have a use case that
                        doesn&apos;t fit?{' '}
                        <a
                            href='https://github.com/ravitejas-tech/queryfish/issues'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-accent-400 no-underline hover:underline'>
                            Open an issue
                        </a>{' '}
                        — scope decisions are made in the open.
                    </p>
                </div>

                {/* Completed */}
                <div className='mb-16'>
                    <div className='mb-6 flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10'>
                            <span className='text-emerald-400'>✓</span>
                        </div>
                        <h2 className='text-2xl font-bold text-text-primary'>Shipped</h2>
                        <span className='rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400'>
                            v0.1
                        </span>
                    </div>

                    <div className='space-y-1'>
                        {completed.map((item) => (
                            <div
                                key={item.title}
                                className='roadmap-item pb-4'>
                                <div className='roadmap-dot roadmap-dot-done'>
                                    <svg
                                        width='12'
                                        height='12'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='white'
                                        strokeWidth='3'>
                                        <path d='M20 6L9 17l-5-5' />
                                    </svg>
                                </div>
                                <h3 className='mb-1 font-semibold text-text-primary'>{item.title}</h3>
                                <p className='text-sm text-text-secondary'>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='section-divider mb-16' />

                {/* Upcoming */}
                <div>
                    <div className='mb-6 flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10'>
                            <span className='text-accent-400'>◇</span>
                        </div>
                        <h2 className='text-2xl font-bold text-text-primary'>Coming Up</h2>
                    </div>

                    <div className='space-y-1'>
                        {upcoming.map((item) => (
                            <div
                                key={item.title}
                                className='roadmap-item pb-4'>
                                <div className='roadmap-dot roadmap-dot-pending' />
                                <div className='flex items-start justify-between gap-4'>
                                    <div>
                                        <h3 className='mb-1 font-semibold text-text-primary'>{item.title}</h3>
                                        <p className='text-sm text-text-secondary'>{item.description}</p>
                                    </div>
                                    <span
                                        className={`mt-1 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            item.tag === 'Up Next'
                                                ? 'bg-accent-500/10 text-accent-400'
                                                : item.tag === 'Planned'
                                                  ? 'bg-glow-500/10 text-glow-400'
                                                  : 'bg-ocean-700/50 text-text-muted'
                                        }`}>
                                        {item.tag}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className='mt-20 text-center'>
                    <div className='glass-card inline-block px-8 py-6'>
                        <p className='mb-4 text-text-secondary'>Want to contribute to the roadmap?</p>
                        <div className='flex flex-col items-center gap-3 sm:flex-row'>
                            <a
                                href='https://github.com/ravitejas-tech/queryfish/issues'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='btn-primary'>
                                Open an Issue
                                <span>→</span>
                            </a>
                            <Link
                                to='/docs'
                                className='btn-secondary'>
                                Read the Docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
