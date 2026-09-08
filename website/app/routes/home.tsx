import type { Route } from './+types/home'
import { Landing } from '../pages/landing'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'QueryFish — OpenAPI → Type-Safe React Query Hooks' },
        {
            name: 'description',
            content:
                'Turn an OpenAPI document into fully typed React Query hooks powered by react-query-kit — with zero runtime and no hand-written client code.',
        },
    ]
}

export default function Home() {
    return <Landing />
}
