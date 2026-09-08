import { Link } from 'react-router'

export function Footer() {
    return (
        <footer className='border-t border-ocean-800/50 bg-ocean-950/80'>
            <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
                    {/* Brand */}
                    <div className='md:col-span-1'>
                        <Link
                            to='/'
                            className='mb-4 flex items-center gap-3 no-underline'>
                            <img
                                src='/icon.png'
                                alt='QueryFish'
                                className='h-12 w-12'
                            />
                            <span className='text-2xl font-bold tracking-tight'>
                                <span className='text-white'>Query</span>
                                <span className='text-brand-sky'>Fish</span>
                            </span>
                        </Link>
                        <p className='text-sm leading-relaxed text-text-muted'>
                            OpenAPI → type-safe React Query hooks. Zero runtime, full type safety.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className='mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary'>Product</h4>
                        <ul className='space-y-2'>
                            <li>
                                <Link
                                    to='/docs'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/examples'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Examples
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/roadmap'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Roadmap
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className='mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary'>Community</h4>
                        <ul className='space-y-2'>
                            <li>
                                <a
                                    href='https://github.com/ravitejas-tech/queryfish'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href='https://github.com/ravitejas-tech/queryfish/issues'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Issues
                                </a>
                            </li>
                            <li>
                                <a
                                    href='https://github.com/ravitejas-tech/queryfish/blob/main/CONTRIBUTING.md'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Contributing
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className='mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary'>Legal</h4>
                        <ul className='space-y-2'>
                            <li>
                                <a
                                    href='https://github.com/ravitejas-tech/queryfish/blob/main/LICENSE'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    MIT License
                                </a>
                            </li>
                            <li>
                                <a
                                    href='https://github.com/ravitejas-tech/queryfish/blob/main/CODE_OF_CONDUCT.md'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-text-muted no-underline transition-colors hover:text-brand-sky'>
                                    Code of Conduct
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className='section-divider mt-10 mb-6' />

                <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                    <p className='text-sm text-text-muted'>
                        Built for teams who&apos;d rather write features than fetch functions.
                    </p>
                    <p className='text-sm text-text-muted'>
                        © {new Date().getFullYear()} QueryFish — MIT License
                    </p>
                </div>
            </div>
        </footer>
    )
}
