import type { Route } from './+types/docs'
import { DocsPage } from '../pages/docs'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Documentation — QueryFish' },
        {
            name: 'description',
            content: 'Quick start guide, configuration reference, CLI options, and API documentation for QueryFish.',
        },
    ]
}

export default function Docs() {
    return <DocsPage />
}
