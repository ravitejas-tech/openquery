/** OpenAPI document → IR. */

import type { OpenQueryConfig, PaginationConfig } from '../config/define.js';
import type {
  HttpMethod,
  IR,
  IRSchema,
  Operation,
  Param,
  ParamLocation,
  PaginationSpec,
} from './types.js';
import { SchemaConverter } from './schema.js';
import {
  NameRegistry,
  deriveOperationId,
  safeIdentifier,
  toPascalCase,
} from './naming.js';

const METHODS: HttpMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

/** GET and HEAD read; everything else mutates. */
function kindFor(method: HttpMethod): 'query' | 'mutation' {
  return method === 'get' || method === 'head' ? 'query' : 'mutation';
}

/** `/users/{id}/posts` → `['users', '{id}', 'posts']` — this becomes the query key. */
function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function pickJsonContent(
  content: Record<string, any> | undefined,
): { schema: any; contentType: string } | undefined {
  if (!content) return undefined;
  const types = Object.keys(content);
  // Prefer JSON; fall back to whatever single type is offered.
  const jsonType =
    types.find((t) => t === 'application/json') ??
    types.find((t) => /\+json$/.test(t)) ??
    types[0];
  if (!jsonType) return undefined;
  const schema = content[jsonType]?.schema;
  if (!schema) return undefined;
  return { schema, contentType: jsonType };
}

/** The 2xx response body, or `void` when there is none (204, empty content). */
function successResponse(responses: Record<string, any> | undefined): any | undefined {
  if (!responses) return undefined;
  const codes = Object.keys(responses);
  const okCode =
    codes.find((c) => c === '200') ??
    codes.find((c) => /^2\d\d$/.test(c)) ??
    codes.find((c) => c === 'default');
  if (!okCode) return undefined;
  return responses[okCode];
}

/**
 * Resolve pagination for an operation.
 *
 * Opt-in only: config first, then an `x-openquery-pagination` extension in the
 * spec. Config wins, and `false` in config suppresses a spec-level opt-in.
 */
function resolvePagination(
  path: string,
  rawOperation: Record<string, any>,
  config: OpenQueryConfig,
): PaginationSpec | undefined {
  const fromConfig = config.pagination?.[path];
  if (fromConfig === false) return undefined;

  const extension = rawOperation['x-openquery-pagination'] as
    PaginationConfig | undefined;
  const chosen = fromConfig ?? extension;
  if (!chosen || typeof chosen !== 'object') return undefined;
  if (!chosen.param || !chosen.nextField) return undefined;

  return {
    param: chosen.param,
    nextField: chosen.nextField,
    initialPageParam: chosen.initialPageParam ?? null,
  };
}

export function buildIR(document: Record<string, any>, config: OpenQueryConfig): IR {
  const registry = new NameRegistry();
  const converter = new SchemaConverter(registry);
  const warnings: string[] = [];

  // Register named schemas first so `$ref`s resolve to names rather than
  // inline expansions — this is what makes recursive types expressible.
  converter.registerComponents(document);

  const operations: Operation[] = [];
  const paths = document['paths'] ?? {};

  for (const [routePath, pathItem] of Object.entries(paths as Record<string, any>)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    // Parameters declared at the path level apply to every operation under it.
    const sharedParams: any[] = Array.isArray(pathItem['parameters'])
      ? pathItem['parameters']
      : [];

    for (const method of METHODS) {
      const raw = pathItem[method];
      if (!raw || typeof raw !== 'object') continue;

      const rawId =
        typeof raw['operationId'] === 'string' && raw['operationId'].trim()
          ? raw['operationId']
          : deriveOperationId(method, routePath);

      const claimed = registry.claim(safeIdentifier(rawId, 'operation'));
      if (claimed.collided) {
        warnings.push(
          `Duplicate operation name "${rawId}" (${method.toUpperCase()} ${routePath}) — emitted as "${claimed.name}".`,
        );
      }
      const operationId = claimed.name;
      const pascal = toPascalCase(operationId);

      // Parameters -------------------------------------------------------
      const allParams: any[] = [
        ...sharedParams,
        ...(Array.isArray(raw['parameters']) ? raw['parameters'] : []),
      ];
      const pathParams: Param[] = [];
      const queryParams: Param[] = [];
      const headerParams: Param[] = [];

      for (const parameter of allParams) {
        if (!parameter || typeof parameter !== 'object') continue;
        const location = parameter['in'] as ParamLocation;
        if (location !== 'path' && location !== 'query' && location !== 'header')
          continue;

        const param: Param = {
          name: parameter['name'],
          propertyName: parameter['name'],
          location,
          // OpenAPI 3 nests the schema; Swagger 2 puts `type` on the parameter.
          schema: converter.convert(parameter['schema'] ?? parameter),
          // Path parameters are always required, whatever the spec says.
          required: location === 'path' ? true : parameter['required'] === true,
          ...(typeof parameter['description'] === 'string'
            ? { description: parameter['description'] }
            : {}),
        };

        if (location === 'path') pathParams.push(param);
        else if (location === 'query') queryParams.push(param);
        else headerParams.push(param);
      }

      // Request body -----------------------------------------------------
      // OpenAPI 3 uses `requestBody.content`; Swagger 2 uses an `in: body`
      // parameter, which the parameter loop above deliberately skipped.
      const swaggerBody = allParams.find(
        (p) => p && typeof p === 'object' && p['in'] === 'body',
      );
      const bodyContent = pickJsonContent(raw['requestBody']?.['content']);

      const requestBody = bodyContent
        ? {
            schema: converter.hoist(`${pascal}Body`, bodyContent.schema),
            required: raw['requestBody']?.['required'] === true,
            contentType: bodyContent.contentType,
          }
        : swaggerBody
          ? {
              schema: converter.hoist(`${pascal}Body`, swaggerBody['schema']),
              required: swaggerBody['required'] === true,
              contentType: 'application/json',
            }
          : undefined;

      // Response ---------------------------------------------------------
      const response = successResponse(raw['responses']);
      const responseContent = pickJsonContent(response?.['content']);
      const responseSchema: IRSchema = responseContent
        ? converter.convert(responseContent.schema)
        : // Swagger 2 puts the schema directly on the response.
          response?.['schema']
          ? converter.convert(response['schema'])
          : { kind: 'void' };

      const pagination = resolvePagination(routePath, raw, config);

      // The cursor stays in queryParams: the request function must still accept
      // it, since that is how the fetcher passes pageParam through. Only the
      // *hook's* variables type omits it — see emit/infinite.ts.
      const cursorParam = pagination
        ? queryParams.find((p) => p.name === pagination.param)
        : undefined;

      if (pagination && !cursorParam) {
        warnings.push(
          `Pagination for ${routePath} names parameter "${pagination.param}", which this operation does not declare.`,
        );
      }

      // Take the page-param type from the spec so it matches the request
      // function's own signature; guessing from initialPageParam does not.
      if (pagination && cursorParam) {
        pagination.paramSchema = cursorParam.schema;
      }

      operations.push({
        operationId,
        method,
        path: routePath,
        pathSegments: splitPath(routePath),
        pathParams,
        queryParams,
        headerParams,
        ...(requestBody ? { requestBody } : {}),
        response: responseSchema,
        kind: kindFor(method),
        ...(pagination ? { pagination } : {}),
        deprecated: raw['deprecated'] === true,
        ...(typeof raw['summary'] === 'string' ? { summary: raw['summary'] } : {}),
        ...(typeof raw['description'] === 'string'
          ? { description: raw['description'] }
          : {}),
        tags: Array.isArray(raw['tags'])
          ? raw['tags'].filter((t: unknown) => typeof t === 'string')
          : [],
      });
    }
  }

  return {
    types: converter.getTypes(),
    operations,
    warnings: [...warnings, ...converter.getWarnings()],
  };
}
