import { describe, it, expect } from 'vitest';
import { parse, join } from './cookie.js';

describe('cookie', () => {
  describe('parse', () => {
    it('should parse Set-Cookie headers correctly', () => {
      const raw = ['sessionId=abc123; Path=/; HttpOnly', 'userId=user456; Path=/'];
      const result = parse(raw);

      expect(result).toEqual({
        sessionId: 'abc123',
        userId: 'user456',
      });
    });

    it('should handle cookies without values', () => {
      const raw = ['emptyValue=; Path=/'];
      const result = parse(raw);

      expect(result).toEqual({
        emptyValue: '',
      });
    });

    it('should trim whitespace from names and values', () => {
      const raw = ['  name  =  value  ; Path=/'];
      const result = parse(raw);

      expect(result).toEqual({
        name: 'value',
      });
    });

    it('should handle empty array', () => {
      const raw: string[] = [];
      const result = parse(raw);

      expect(result).toEqual({});
    });

    it('should handle malformed cookies gracefully', () => {
      const raw = ['validCookie=value', 'invalidCookie', '=noName'];
      const result = parse(raw);

      expect(result.validCookie).toBe('value');
    });
  });

  describe('join', () => {
    it('should join cookie store into Cookie header string', () => {
      const store = {
        sessionId: 'abc123',
        userId: 'user456',
      };
      const result = join(store);

      expect(result).toBe('sessionId=abc123; userId=user456');
    });

    it('should handle empty cookie store', () => {
      const store = {};
      const result = join(store);

      expect(result).toBe('');
    });

    it('should handle single cookie', () => {
      const store = {
        sessionId: 'abc123',
      };
      const result = join(store);

      expect(result).toBe('sessionId=abc123');
    });

    it('should work with regular objects', () => {
      const store = {
        cookie1: 'value1',
        cookie2: 'value2',
        cookie3: 'value3',
      };

      const result = join(store);

      expect(result).toBe('cookie1=value1; cookie2=value2; cookie3=value3');
    });
  });

  describe('round-trip', () => {
    it('should parse and join correctly', () => {
      const raw = ['cookie1=value1; Path=/', 'cookie2=value2; HttpOnly'];
      const parsed = parse(raw);
      const joined = join(parsed);

      expect(joined).toBe('cookie1=value1; cookie2=value2');
    });
  });
});
