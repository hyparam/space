import { createContext, useEffect, useState } from "react";
import { fetchOAuth } from "../Login.tsx";
import {  OAuthResult} from "@huggingface/hub";

interface AuthContextValue {
  oAuthResult?: OAuthResult;
  headers: Record<string, string>;
  fetch: typeof window.fetch;
}

function createAuthFromOAuthResult(oAuthResult: OAuthResult): AuthContextValue {  
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

function createEmptyAuth(): AuthContextValue {
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

interface AuthProviderProps {
  children?: React.ReactNode;
}
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthContextValue | undefined>(undefined);

  useEffect(() => {
    fetchOAuth()
      .then((oAuthResult) => {
        if (!oAuthResult) {
          setAuth(createEmptyAuth());
          return;
        }
        if (oAuthResult.accessTokenExpiresAt < new Date()) {
          console.error("Access token expired");
          // TODO(SL): refresh token? delete the previous token?
          setAuth(createEmptyAuth());
          return;
        }
        setAuth(createAuthFromOAuthResult(oAuthResult));
      })
      .catch((e: unknown) => {
        setAuth(createEmptyAuth());
        console.error(e);
      });
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
