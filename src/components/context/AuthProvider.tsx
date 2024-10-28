import { useEffect, useState } from "react";
import { fetchOAuth } from "../../lib/login.ts";
import {
  AuthContext,
  AuthContextValue,
  createEmptyAuth,
  createAuthFromOAuthResult,
} from "../../contexts/authContext.ts";

interface AuthProviderProps {
  children?: React.ReactNode;
}
export default function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthContextValue | undefined>(undefined);

  useEffect(() => {
    fetchOAuth()
      .then((oAuthResult) => {
        if (!oAuthResult) {
          setAuth(createEmptyAuth());
          return;
        }
        setAuth(createAuthFromOAuthResult(oAuthResult));
      })
      .catch((e: unknown) => {
        console.error("Error fetching OAuth");
        setAuth(createEmptyAuth());
        console.error(e);
      });
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
