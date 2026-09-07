# OpenQuery

> OpenAPI → Type-safe React Query hooks.

OpenQuery is an open-source code generator that converts OpenAPI/Swagger
specifications into type-safe API clients built specifically for
[React Query](https://tanstack.com/query) and
[react-query-kit](https://github.com/HuolalaTech/react-query-kit).

## ✨ Features

- Generate TypeScript types from OpenAPI/Swagger
- Generate API request functions
- Generate React Query hooks
- Generate mutations and queries
- Generate infinite queries
- Type-safe query variables and responses
- Minimal configuration
- Built specifically for React Query Kit

## 🚀 Example

Input:

```yaml
GET /users/{id}
````

OpenQuery generates:

```ts
const { data } = useGetUser.useQuery({
  variables: {
    id: "123",
  },
});
```

## 📦 Installation

```bash
npm install openquery
```

## 🛠️ Usage

```bash
npx openquery generate
```

Or configure it using an `openquery.config.ts` file:

```ts
export default {
  input: "./openapi.yaml",
  output: "./src/api",
};
```

## 🎯 Goal

OpenQuery aims to provide a simple and focused alternative to large
OpenAPI code generators.

Instead of supporting everything, OpenQuery focuses on doing one thing well:

**OpenAPI → React Query Kit**

## 🤝 Contributing

OpenQuery is open source and contributions are welcome.

Feel free to open an issue, suggest an improvement, or submit a pull request.

## 📄 License

MIT
