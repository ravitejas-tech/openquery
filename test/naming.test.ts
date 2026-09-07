import { describe, expect, it } from 'vitest';

import {
  NameRegistry,
  deriveOperationId,
  isValidPropertyName,
  quotePropertyIfNeeded,
  safeIdentifier,
  toCamelCase,
  toPascalCase,
} from '../src/ir/naming.js';

describe('toCamelCase', () => {
  it.each([
    ['get_user_by_id', 'getUserById'],
    ['GetUserByID', 'getUserById'],
    ['get-user-by-id', 'getUserById'],
    ['get user by id', 'getUserById'],
    ['getUser', 'getUser'],
    ['HTTPResponse', 'httpResponse'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(toCamelCase(input)).toBe(expected);
  });
});

describe('toPascalCase', () => {
  it('capitalizes the first word', () => {
    expect(toPascalCase('get_user')).toBe('GetUser');
    expect(toPascalCase('user')).toBe('User');
  });
});

describe('safeIdentifier', () => {
  it('prefixes leading digits', () => {
    expect(safeIdentifier('123abc')).toBe('n123abc');
  });

  it('suffixes reserved words', () => {
    expect(safeIdentifier('delete')).toBe('delete_');
    expect(safeIdentifier('new')).toBe('new_');
    expect(safeIdentifier('type')).toBe('type_');
  });

  it('falls back when nothing usable remains', () => {
    expect(safeIdentifier('...', 'fallback')).toBe('fallback');
    expect(safeIdentifier('')).toBe('value');
  });

  it('strips characters that are invalid in identifiers', () => {
    expect(safeIdentifier('filter[status]')).toBe('filterStatus');
    expect(safeIdentifier('X-Request-Id')).toBe('xRequestId');
  });
});

describe('deriveOperationId', () => {
  it('builds a name from method and path', () => {
    expect(deriveOperationId('get', '/users')).toBe('getUsers');
    expect(deriveOperationId('get', '/users/{id}')).toBe('getUsersById');
    expect(deriveOperationId('post', '/users/{userId}/posts')).toBe(
      'postUsersByUserIdPosts',
    );
  });

  it('handles the root path', () => {
    // `get` alone is a reserved word, so it gets the reserved-word suffix.
    expect(deriveOperationId('get', '/')).toBe('get_');
    expect(deriveOperationId('post', '/')).toBe('post');
  });
});

describe('property names', () => {
  it('recognizes valid identifiers', () => {
    expect(isValidPropertyName('foo')).toBe(true);
    expect(isValidPropertyName('_foo$1')).toBe(true);
    expect(isValidPropertyName('filter[status]')).toBe(false);
    expect(isValidPropertyName('X-Request-Id')).toBe(false);
  });

  it('quotes only what needs quoting', () => {
    expect(quotePropertyIfNeeded('foo')).toBe('foo');
    expect(quotePropertyIfNeeded('filter[status]')).toBe('"filter[status]"');
  });
});

describe('NameRegistry', () => {
  it('returns the name unchanged when free', () => {
    const registry = new NameRegistry();
    expect(registry.claim('getUser')).toEqual({ name: 'getUser', collided: false });
  });

  it('suffixes duplicates deterministically', () => {
    const registry = new NameRegistry();
    registry.claim('getUser');
    expect(registry.claim('getUser')).toEqual({ name: 'getUser2', collided: true });
    expect(registry.claim('getUser')).toEqual({ name: 'getUser3', collided: true });
  });

  it('does not collide with an existing suffixed name', () => {
    const registry = new NameRegistry();
    registry.claim('getUser');
    registry.claim('getUser2'); // taken directly
    // The next duplicate must skip past the occupied suffix.
    expect(registry.claim('getUser').name).toBe('getUser3');
  });
});
