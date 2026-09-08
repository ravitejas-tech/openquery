import type { Route } from './+types/examples'
import { ExamplesPage } from '../pages/examples'

export function meta({}: Route.MetaArgs) {
    const title = 'Examples — QueryFish'
    const description =
        'Interactive code examples demonstrating QueryFish-generated React Query hooks with Axios and Fetch using the OpenAPI Petstore spec.'
    const url = 'https://queryfish.dev/examples'
    const image = 'https://queryfish.dev/logo.png'

    return [
        { title },
        { name: 'description', content: description },
        { name: 'keywords', content: 'queryfish examples, react query kit code samples, openapi query hooks example' },
        { name: 'robots', content: 'index, follow' },

        // OpenGraph
        { property: 'og:type', content: 'article' },
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

export default function Examples() {
    return <ExamplesPage />
}
