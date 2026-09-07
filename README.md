# OpenQuery

> OpenAPI → Type-safe React Query Kit factories.

OpenQuery is an open-source code generator that transforms your
[OpenAPI/Swagger](https://swagger.io/specification/) specifications into
fully typed API clients powered by
[React Query](https://tanstack.com/query) and
[react-query-kit](https://github.com/HuolalaTech/react-query-kit).

---

## ✨ Features

| Feature | Description |
| --- | --- |
| **TypeScript types** | Auto-generated request/response types from your OpenAPI spec |
| **`createQuery`** | Generated query factories for every `GET` endpoint |
| **`createMutation`** | Generated mutation factories for `POST` / `PUT` / `PATCH` / `DELETE` endpoints |
| **`createInfiniteQuery`** | Generated infinite query factories for paginated `GET` endpoints |
| **Type-safe variables** | Path params, query params, and request bodies are fully typed |
| **Minimal config** | Point at a spec, get production-ready code |
| **Zero runtime** | All output is plain TypeScript — no hidden runtime dependencies |

---

## 🚀 Quick Example

Given an OpenAPI spec:

```yaml
paths:
  /users/{id}:
    get:
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
```

OpenQuery generates a **query factory**:

```ts
import { createQuery } from "react-query-kit";
import { getUser } from "./requests";
import type { GetUserVariables, GetUserResponse } from "./types";

export const useGetUser = createQuery<GetUserResponse, GetUserVariables>({
  queryKey: ["getUser"],
  fetcher: (variables) => getUser(variables),
});
```

Use it in your component:

```tsx
const { data } = useGetUser.useQuery({
  variables: { id: "123" },
});
```

### Mutations

```yaml
paths:
  /users:
    post:
      operationId: createUser
```

Generates:

```ts
import { createMutation } from "react-query-kit";

export const useCreateUser = createMutation<
  CreateUserResponse,
  CreateUserVariables
>({
  mutationFn: (variables) => createUser(variables),
});
```

### Infinite Queries (Paginated Endpoints)

```yaml
paths:
  /users:
    get:
      operationId: listUsers
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
```

Generates:

```ts
import { createInfiniteQuery } from "react-query-kit";

export const useListUsers = createInfiniteQuery<
  ListUsersResponse,
  ListUsersVariables,
  string
>({
  queryKey: ["listUsers"],
  fetcher: (variables, { pageParam }) =>
    listUsers({ ...variables, cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: "",
});
```

---

## 📦 Installation

```bash
npm install openquery --save-dev
# or
yarn add openquery --dev
```

---

## 🛠️ Usage

### CLI

```bash
npx openquery generate
```

### Config file

Create an `openquery.config.ts` in your project root:

```ts
import { defineConfig } from "openquery";

export default defineConfig({
  input: "./openapi.yaml", // path or URL to your OpenAPI spec
  output: "./src/api", // output directory for generated code
});
```

Then run:

```bash
npx openquery generate
```

### Generated output structure

```
src/api/
├── types.ts           # TypeScript interfaces & enums
├── requests.ts        # Axios / fetch request functions
├── queries.ts         # createQuery factories
├── mutations.ts       # createMutation factories
└── infiniteQueries.ts # createInfiniteQuery factories
```

---

## 🔄 OpenQuery vs Orval

| | **OpenQuery** | **Orval** |
| --- | --- | --- |
| **Output style** | `createQuery` / `createMutation` / `createInfiniteQuery` (react-query-kit) | `useQuery` / `useMutation` hooks |
| **Pagination** | First-class `createInfiniteQuery` support | Manual infinite query setup |
| **Framework** | React Query + react-query-kit | React Query, SWR, Angular, Vue, etc. |
| **Focus** | One thing, done well | Broad multi-framework support |
| **Mocking** | Planned | MSW + Faker.js |

---

## 🎯 Goal

OpenQuery aims to be the best-in-class code generator for teams using
**React Query Kit**.

Instead of trying to support every framework and every pattern, OpenQuery
focuses on doing one thing exceptionally well:

**OpenAPI → `createQuery` · `createMutation` · `createInfiniteQuery`**

---

## 🗺️ Roadmap

- [x] Core code generation (`createQuery`, `createMutation`)
- [ ] `createInfiniteQuery` for paginated endpoints
- [ ] Custom Axios / fetch instance support
- [ ] Zod schema generation for runtime validation
- [ ] MSW mock handler generation
- [ ] Watch mode for spec changes
- [ ] Plugin system for custom output

---

## 🤝 Contributing

OpenQuery is open source and contributions are welcome.

Feel free to open an issue, suggest an improvement, or submit a pull request.

---

## 📄 License

MIT
