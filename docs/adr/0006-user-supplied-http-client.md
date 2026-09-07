# 0006. The HTTP client is supplied by the user

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Generated request functions have to issue HTTP requests. A generator can either
ship a client, or require one.

Shipping a client means owning the parts of HTTP that are genuinely
application-specific: authentication and token refresh, retries and backoff,
base URL selection per environment, request/response interceptors, error
normalization, tracing headers. Every project already has opinions about these,
usually implemented, frequently non-negotiable.

It also contradicts a stated goal. The README promises "Zero runtime" — and a
bundled client is a runtime dependency, one that must stay installed in
production and be version-matched against the generated code.

## Decision

Generated code imports a `client` from a module the user writes. The path is
configured:

```ts
export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  client: './src/api/client.ts',
});
```

The contract is a minimal structural interface (`QueryFishClient` in
`src/index.ts`):

```ts
interface QueryFishClient {
  request<T>(config: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    data?: unknown;
  }): Promise<T>;
}
```

An axios instance satisfies this as-is. A `fetch` wrapper is about 40 lines —
see `examples/petstore-react/src/client.ts`.

Relative paths are rewritten to be correct from the output directory; bare
specifiers (`@/lib/client`) pass through untouched so path aliases work.

## Consequences

### What this enables

- QueryFish is a `devDependency`. Nothing it publishes ships to production.
- Auth, retries, and interceptors live in user code, where they can be read,
  tested, and debugged with normal tooling.
- Any HTTP library works — axios, fetch, ky, a corporate wrapper — with no
  adapter layer to maintain.
- Generated code has one import from outside itself, which keeps it readable.

### What this costs

- Zero-config generation isn't possible: a user must write ~10 lines before
  anything runs. This is the main cost, and it lands on first-run experience.
- The structural interface is a compatibility surface. Widening it later (a
  `signal` for cancellation, say) is a breaking change for custom clients.
- The interface is shaped like axios (`params`, `data`), which reads slightly
  oddly to `fetch` users. Mitigated by the worked fetch example, which the test
  suite exercises so it can't rot.

### What we rejected

**Bundling a small fetch runtime.** Best onboarding, but it breaks the
zero-runtime promise and forces users with existing interceptors to either
migrate or bypass the generated layer.

**Inlining a fetch helper into the generated output.** Preserves zero runtime
and needs no setup, but the helper is then generated code the user must not
edit while also being the natural place to add auth — an obvious trap.

**Supporting both, with the client optional.** Doubles the surface: two code
paths, two sets of docs, two failure modes, before the project has users who
have said which they prefer. Reconsider once there is evidence.
