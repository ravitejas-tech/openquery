import type { Route } from './+types/home'
import { Landing } from '../pages/landing'

export function meta({}: Route.MetaArgs) {
    const title = 'QueryFish — OpenAPI → Type-Safe React Query Hooks'
    const description =
        'Turn an OpenAPI 3.0, 3.1 or Swagger spec into fully typed React Query hooks powered by react-query-kit — with zero runtime overhead and no hand-written client code.'
    const url = 'https://queryfish.dev/'
    const image = 'https://queryfish.dev/logo.png'

    return [
        { title },
        { name: 'description', content: description },
        { name: 'keywords', content: 'openapi, swagger, react-query, tanstack-query, react-query-kit, codegen, typescript, type-safe' },
        { name: 'robots', content: 'index, follow' },

        // OpenGraph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'QueryFish' },
        { property: 'og:url', content: url },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: image },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },

        // Links
        { tagName: 'link', rel: 'canonical', href: url },
    ]
}

export default function Home() {
    return <Landing />
}
