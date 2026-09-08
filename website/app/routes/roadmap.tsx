import type { Route } from './+types/roadmap'
import { RoadmapPage } from '../pages/roadmap'

export function meta({}: Route.MetaArgs) {
    const title = 'Roadmap — QueryFish'
    const description =
        'QueryFish feature roadmap: Track shipped capabilities, current release features, and upcoming enhancements for OpenAPI React Query codegen.'
    const url = 'https://queryfish.dev/roadmap'
    const image = 'https://queryfish.dev/logo.png'

    return [
        { title },
        { name: 'description', content: description },
        { name: 'keywords', content: 'queryfish roadmap, openapi codegen features, future releases' },
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

export default function Roadmap() {
    return <RoadmapPage />
}
