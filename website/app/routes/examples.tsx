import type { Route } from './+types/examples'
import { ExamplesPage } from '../pages/examples'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Examples — QueryFish' },
        {
            name: 'description',
            content: 'Step-by-step walkthrough of a React app using QueryFish-generated hooks with the Petstore API.',
        },
    ]
}

export default function Examples() {
    return <ExamplesPage />
}
