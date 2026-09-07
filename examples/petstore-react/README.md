# Petstore example

A small React app consuming hooks that QueryFish generated from
[`openapi.yaml`](./openapi.yaml).

The generated output in [`src/api/`](./src/api) is **committed on purpose** — it
shows what QueryFish actually produces without needing to run anything, and CI
regenerates it to make sure the committed copy never drifts from the generator.

```bash
npm install
npm run generate   # regenerate src/api from openapi.yaml
npm run dev        # start the app
```

The API URL defaults to a placeholder host; point it somewhere real with
`VITE_API_URL` if you want live data.

## What to look at

| File                                           | Why                                                   |
| ---------------------------------------------- | ----------------------------------------------------- |
| [`queryfish.config.ts`](./queryfish.config.ts) | The whole configuration — three lines                 |
| [`src/client.ts`](./src/client.ts)             | The HTTP client _you_ own; QueryFish ships no runtime |
| [`src/api/`](./src/api)                        | Generated: types, requests, queries, mutations        |
| [`src/App.tsx`](./src/App.tsx)                 | Hooks in use, including prefix invalidation           |

## Things worth noticing

**Query keys mirror the URL.** `useGetPet` uses `['pets', '{petId}']`, so a
single call clears every pet-related query:

```ts
queryClient.invalidateQueries({ queryKey: ['pets'] });
```

**Variables are typed from the spec.** `status` accepts only
`'available' | 'pending' | 'sold'`; a typo fails the build rather than the
request.

**Path parameters are required.** `useGetPet({ variables: { petId } })` will not
compile without `petId`, even though the spec's `required` flag is easy to
forget.

**No infinite queries here.** This spec doesn't opt in to pagination, so
`infiniteQueries.ts` is not generated at all — QueryFish never guesses which
endpoints paginate.
