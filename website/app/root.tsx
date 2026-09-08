import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import type { Route } from './+types/root'
import { Navbar } from './components/navbar'
import { Footer } from './components/footer'
import './app.css'

export const links: Route.LinksFunction = () => [
    { rel: 'icon', type: 'image/png', href: '/icon.png' },
    { rel: 'apple-touch-icon', href: '/icon.png' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
    },
    {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;700&display=swap',
    },
]

export function Layout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'QueryFish',
        operatingSystem: 'Node.js',
        applicationCategory: 'DeveloperApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        description:
            'Turn OpenAPI 3.0, 3.1 and Swagger 2.0 specs into fully-typed React Query hooks powered by react-query-kit with zero runtime bundle overhead.',
        softwareVersion: '1.0.0',
        license: 'https://opensource.org/licenses/MIT',
        url: 'https://queryfish.dev/',
    }

    return (
        <html lang='en'>
            <head>
                <meta charSet='utf-8' />
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1'
                />
                <meta
                    name='theme-color'
                    content='#020617'
                />
                <Meta />
                <Links />
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = 'Oops!'
    let details = 'An unexpected error occurred.'
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error'
        details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return (
        <main className='container mx-auto p-4 pt-24'>
            <h1 className='mb-4 text-4xl font-bold text-text-primary'>{message}</h1>
            <p className='text-text-secondary'>{details}</p>
            {stack && (
                <pre className='code-block mt-6 w-full overflow-x-auto p-4'>
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    )
}
