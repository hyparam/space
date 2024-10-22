import { createContext, useEffect, useState } from "react";
import { fetchOAuthToken } from "../Login.tsx";

interface AuthContextValue {
  headers: Record<string, string>;
  fetch: typeof window.fetch;
}

function createAuthFromToken(token: string): AuthContextValue {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  return {
    headers,
    fetch: async (input, init) => {
      if (init === undefined) init = {};
      if (init.headers === undefined) init.headers = {};
      init.headers = {
        ...headers,
        /// the Authorization header can be overridden by the caller
        ...init.headers,
      };
      console.log("fetching", input, init);
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
    fetchOAuthToken()
      .then((token) => {
        console.log("Got token", token);
        setAuth(createAuthFromToken(token));
      })
      .catch((e: unknown) => {
        console.error("Failed to get token", e);
        setAuth(createEmptyAuth());
        console.error(e);
      });
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
