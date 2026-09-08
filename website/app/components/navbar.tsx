import { Link, useLocation } from 'react-router'
import { useState } from 'react'

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/docs', label: 'Docs' },
    { to: '/examples', label: 'Examples' },
    { to: '/roadmap', label: 'Roadmap' },
]

export function Navbar() {
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <nav className='glass-nav fixed top-0 left-0 right-0 z-50'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='flex h-16 items-center justify-between'>
                    {/* Logo — uses the actual icon.png */}
                    <Link
                        to='/'
                        className='flex items-center gap-2.5 text-lg font-bold text-text-primary no-underline'>
                        <img
                            src='/icon.png'
                            alt='QueryFish'
                            className='h-8 w-8'
                        />
                        <span className='text-xl font-bold tracking-tight'>
                            <span className='text-white'>Query</span>
                            <span className='text-brand-sky'>Fish</span>
                        </span>
                    </Link>

                    {/* Desktop links — minimal style with bottom indicator */}
                    <div className='hidden items-center gap-0.5 md:flex'>
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.to
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative px-4 py-2 text-sm font-medium no-underline transition-colors duration-200 ${
                                        isActive ? 'text-brand-sky' : 'text-text-secondary hover:text-text-primary'
                                    }`}>
                                    {link.label}
                                    {isActive && (
                                        <span className='absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan' />
                                    )}
                                </Link>
                            )
                        })}
                        <div className='mx-3 h-5 w-px bg-ocean-700' />
                        <a
                            href='https://github.com/ravitejas-tech/queryfish'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary no-underline transition-colors duration-200 hover:text-text-primary'>
                            <GitHubIcon />
                            GitHub
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className='rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary md:hidden'
                        aria-label='Toggle menu'>
                        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className='border-t border-ocean-800 pb-4 pt-2 md:hidden'>
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-2.5 text-sm font-medium no-underline ${
                                    location.pathname === link.to
                                        ? 'text-brand-sky'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}>
                                {location.pathname === link.to && (
                                    <span className='mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-sky' />
                                )}
                                {link.label}
                            </Link>
                        ))}
                        <a
                            href='https://github.com/ravitejas-tech/queryfish'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary no-underline hover:text-text-primary'>
                            <GitHubIcon />
                            GitHub
                        </a>
                    </div>
                )}
            </div>
        </nav>
    )
}

function GitHubIcon() {
    return (
        <svg
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='currentColor'>
            <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
        </svg>
    )
}

function MenuIcon() {
    return (
        <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'>
            <path d='M3 12h18M3 6h18M3 18h18' />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'>
            <path d='M18 6L6 18M6 6l12 12' />
        </svg>
    )
}
