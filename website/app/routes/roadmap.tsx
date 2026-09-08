import type { Route } from './+types/roadmap'
import { RoadmapPage } from '../pages/roadmap'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Roadmap — QueryFish' },
        {
            name: 'description',
            content: "What's shipped, what's next, and where QueryFish is headed. Feature roadmap and planned releases.",
        },
    ]
}

export default function Roadmap() {
    return <RoadmapPage />
}
