/**
 * The intermediate representation.
 *
 * Everything downstream of the loader reads this model and nothing else. Keeping
 * emitters off the raw OpenAPI document is what lets us solve cycles, naming, and
 * pagination exactly once — see docs/architecture.md.
 */

/** A resolved TypeScript type expression, plus any named types it depends on. */
export type IRSchema =
  | {
      kind: 'primitive';
      type: 'string' | 'number' | 'boolean';
      enum?: string[] | number[];
    }
  | { kind: 'literal'; values: Array<string | number> }
  | { kind: 'array'; items: IRSchema }
  | { kind: 'object'; properties: IRProperty[]; additional?: IRSchema }
  | { kind: 'record'; value: IRSchema }
  | { kind: 'union'; members: IRSchema[] }
  | { kind: 'intersection'; members: IRSchema[] }
  /** A reference to a named type emitted at the top level. Cycle-breaking lives here. */
  | { kind: 'ref'; name: string }
  | { kind: 'null' }
  | { kind: 'unknown' }
  | { kind: 'void' };

export interface IRProperty {
  name: string;
  schema: IRSchema;
  required: boolean;
  description?: string;
  deprecated?: boolean;
}

/** A named type hoisted to the top level of types.ts. */
export interface NamedType {
  name: string;
  schema: IRSchema;
  description?: string;
}

export type ParamLocation = 'path' | 'query' | 'header';

export interface Param {
  /** Name as it appears in the spec (may not be a valid TS identifier). */
  name: string;
  /** Safe TS property name used in generated variables types. */
  propertyName: string;
  location: ParamLocation;
  schema: IRSchema;
  required: boolean;
  description?: string;
}

/**
 * Describes how an endpoint paginates.
 *
 * Only ever set when the user opts in — either via `pagination` config or an
 * `x-queryfish-pagination` extension in the spec. OpenAPI has no pagination
 * standard, and a wrong guess produces a hook that silently fetches forever.
 */
export interface PaginationSpec {
  /** Query parameter carrying the cursor/page value. Excluded from variables. */
  param: string;
  /** Dot-path in the response holding the next cursor, e.g. `nextCursor`. */
  nextField: string;
  /** Initial value for `pageParam`. */
  initialPageParam: string | number | null;
  /**
   * Schema of the cursor parameter as declared in the spec.
   *
   * The page-param type must match what the request function actually accepts,
   * so it is taken from the spec rather than guessed from `initialPageParam`.
   */
  paramSchema?: IRSchema;
}

export type HttpMethod =
  'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export interface Operation {
  /** Resolved, sanitized, collision-free. */
  operationId: string;
  method: HttpMethod;
  /** Raw templated path, e.g. `/users/{id}`. */
  path: string;
  /** Literal path segments, e.g. `['users', '{id}']` — this is the query key. */
  pathSegments: string[];
  pathParams: Param[];
  queryParams: Param[];
  headerParams: Param[];
  requestBody?: { schema: IRSchema; required: boolean; contentType: string };
  /** The 2xx JSON response type; `void` for 204/no content. */
  response: IRSchema;
  /** GET/HEAD are queries; everything else mutates. */
  kind: 'query' | 'mutation';
  pagination?: PaginationSpec;
  deprecated: boolean;
  summary?: string;
  description?: string;
  tags: string[];
}

export interface IR {
  /** Named types, in emission order. */
  types: NamedType[];
  operations: Operation[];
  /** Non-fatal problems worth surfacing to the user. */
  warnings: string[];
}
