import { useState } from 'react'

interface CodeBlockProps {
    code: string
    language?: string
    title?: string
    showCopy?: boolean
}

export function CodeBlock({ code, language = 'typescript', title, showCopy = true }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className='code-block overflow-hidden'>
            {(title || showCopy) && (
                <div className='flex items-center justify-between border-b border-brand-blue/10 px-4 py-2.5'>
                    {title && <span className='text-xs font-medium text-text-muted'>{title}</span>}
                    {showCopy && (
                        <button
                            onClick={handleCopy}
                            className='ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-ocean-700/50 hover:text-brand-sky cursor-pointer'
                            aria-label='Copy code'>
                            {copied ? (
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2.5'
                                    className='text-emerald-400'>
                                    <path d='M20 6L9 17l-5-5' />
                                </svg>
                            ) : (
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'>
                                    <rect
                                        x='9'
                                        y='9'
                                        width='13'
                                        height='13'
                                        rx='2'
                                    />
                                    <path d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' />
                                </svg>
                            )}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    )}
                </div>
            )}
            <pre className='overflow-x-auto p-4'>
                <code className={`language-${language} text-text-secondary`}>{code}</code>
            </pre>
        </div>
    )
}

export function InstallSnippet() {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText('npm install queryfish --save-dev')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className='install-snippet group cursor-pointer'>
            <span className='select-none text-text-muted/60 font-mono text-xl sm:text-2xl font-bold'>$</span>
            <span className='font-mono text-base sm:text-lg md:text-xl font-semibold text-brand-sky tracking-tight'>
                npm install queryfish --save-dev
            </span>
            <span className='ml-2 flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue/15 text-text-secondary transition-all duration-200 group-hover:scale-105 group-hover:bg-brand-blue/30 group-hover:text-brand-sky'>
                {copied ? (
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        className='text-emerald-400'>
                        <path d='M20 6L9 17l-5-5' />
                    </svg>
                ) : (
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'>
                        <rect
                            x='9'
                            y='9'
                            width='13'
                            height='13'
                            rx='2'
                        />
                        <path d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' />
                    </svg>
                )}
            </span>
            {copied && <span className='text-xs font-semibold text-emerald-400 font-sans transition-all animate-fade-in-up'>Copied!</span>}
        </button>
    )
}
