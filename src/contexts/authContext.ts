import { createContext } from "react";
import {  OAuthResult} from "@huggingface/hub";

export interface AuthContextValue {
  oAuthResult?: OAuthResult;
  headers: Record<string, string>;
  fetch: typeof window.fetch;
}

export function createAuthFromOAuthResult(oAuthResult: OAuthResult): AuthContextValue {  
  const headers = {
    Authorization: `Bearer ${oAuthResult.accessToken}`,
  };
  return {
    oAuthResult,
    headers,
    fetch: async (input, init) => {
      if (init === undefined) init = {};
      if (init.headers === undefined) init.headers = {};
      init.headers = {
        ...headers,
        /// the Authorization header can be overridden by the caller
        ...init.headers,
      };
      return window.fetch(input, init);
    },
  };
}

export function createEmptyAuth(): AuthContextValue {
  return {
    headers: {},
    fetch: window.fetch.bind(window),
  };
}

// The AuthContext provides a way to access the authentication headers and fetch function
// undefined means that the authentication has not been checked yet
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
