import {parse as parseCookie, parseSetCookie, type SerializeOptions, type SetCookie, stringifySetCookie} from 'cookie';

export type {SetCookie as ICookie};

export interface ICookieParseOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | 'strict' | 'lax' | 'none';
  maxAge?: number;
}

class HTTPCookieManager {
  static parseCookies(cookieHeader: string): Map<string, string> {
    if (!cookieHeader) {
      return new Map();
    }
    const parsed = parseCookie(cookieHeader);
    const result = new Map<string, string>();
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  static parseSetCookieHeader(header: string | string[] | undefined): SetCookie[] {
    if (!header) {
      return [];
    }
    const headers = Array.isArray(header) ? header : [header];
    return headers.map(h => parseSetCookie(h));
  }

  static serialize(name: string, value: string, options?: ICookieParseOptions): string {
    return stringifySetCookie({
      name,
      value,
      domain: options?.domain,
      path: options?.path,
      expires: options?.expires,
      httpOnly: options?.httpOnly,
      secure: options?.secure,
      sameSite: options?.sameSite,
      maxAge: options?.maxAge,
    } as SerializeOptions & {name: string; value: string});
  }

  static serializeCookies(cookies: Map<string, string>): string {
    const pairs: string[] = [];
    for (const [name, value] of cookies) {
      pairs.push(`${name}=${value}`);
    }
    return pairs.join('; ');
  }
}

export {HTTPCookieManager};
