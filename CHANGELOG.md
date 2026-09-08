# queryfish

## 0.2.0

### Minor Changes

- 5b18625: Initial release.
  
  Generates typed React Query Kit factories from OpenAPI 3.0, 3.1, and Swagger 2.0
  documents:
  
  - `createQuery` factories for `GET`/`HEAD` operations, keyed by URL path
    segments so a whole resource tree can be invalidated with a prefix match
  - `createMutation` factories for everything else
  - `createInfiniteQuery` factories, opt-in per endpoint via config or an
    `x-queryfish-pagination` extension — never inferred
  - Full TypeScript types for parameters, request bodies, and responses,
    including recursive and mutually recursive schemas
  - CLI with `--watch`, `--dry-run`, and errors that name the failing spec location
  - Zero runtime dependencies: generated code imports your own HTTP client
