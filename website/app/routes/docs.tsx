import type { Route } from './+types/docs'
import { DocsPage } from '../pages/docs'

export function meta({}: Route.MetaArgs) {
    const title = 'Documentation — QueryFish'
    const description =
        'Comprehensive guide to QueryFish: Quick start, CLI commands, configuration options, URL query key structure, and opt-in pagination.'
    const url = 'https://queryfish.dev/docs'
    const image = 'https://queryfish.dev/logo.png'

    return [
        { title },
        { name: 'description', content: description },
        { name: 'keywords', content: 'queryfish docs, openapi codegen documentation, react query kit guide, typescript api hooks' },
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

export default function Docs() {
    return <DocsPage />
}
