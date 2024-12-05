// export interface AuthContextValue {
//   oAuthResult?: OAuthResult;
//   requestInit?: RequestInit;
// }

// export function createAuthFromOAuthResult(oAuthResult: OAuthResult): AuthContextValue {
//   const headers = {
//     Authorization: `Bearer ${oAuthResult.accessToken}`,
//   };
//   return {
//     oAuthResult,
//     headers,
//     fetch: async (input, init) => {
//       if (init === undefined) init = {};
//       if (init.headers === undefined) init.headers = {};
//       init.headers = {
//         ...headers,
//         /// the Authorization header can be overridden by the caller
//         ...init.headers,
//       };
//       return window.fetch(input, init);
//     },
//   };
// }

// export function createEmptyAuth(): AuthContextValue {
//   return {
//     headers: {},
//     fetch: window.fetch.bind(window),
//   };
// }

// // The AuthContext provides a way to access the authentication headers and fetch function
// // undefined means that the authentication has not been checked yet
// export const AuthContext = createContext<AuthContextValue | undefined>(
//   undefined
// );

// import { useEffect, useState } from "react";
// import { fetchOAuth } from "../../lib/login.ts";
// import {
//   AuthContext,
//   AuthContextValue,
//   createEmptyAuth,
//   createAuthFromOAuthResult,
// } from "../../contexts/authContext.ts";

// interface AuthProviderProps {
//   children?: React.ReactNode;
// }
// export default function AuthProvider({ children }: AuthProviderProps) {
//   const [auth, setAuth] = useState<AuthContextValue | undefined>(undefined);

//   useEffect(() => {
//     fetchOAuth()
//       .then((oAuthResult) => {
//         if (!oAuthResult) {
//           setAuth(createEmptyAuth());
//           return;
//         }
//         setAuth(createAuthFromOAuthResult(oAuthResult));
//       })
//       .catch((e: unknown) => {
//         console.error("Error fetching OAuth");
//         setAuth(createEmptyAuth());
//         console.error(e);
//       });
//   }, []);

//   return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
// };

import {
  OAuthResult,
  oauthHandleRedirectIfPresent,
  oauthLoginUrl,
} from '@huggingface/hub'

/// try to redirect to the URL before login
function maybeRedirectToUrlBeforeLogin(oAuthResult: OAuthResult) {
  if (oAuthResult.state) {
    try {
      const state: unknown = JSON.parse(oAuthResult.state)
      if (
        typeof state !== 'object' ||
                state === null ||
                !('urlBeforeLogin' in state)
      ) {
        throw new Error('Invalid state')
      }
      const { urlBeforeLogin } = state
      if (!(typeof urlBeforeLogin === 'string')) {
        throw new Error('Invalid redirect URL: not a string')
      }
      const url = new URL(urlBeforeLogin)
      if (url.origin !== window.location.origin) {
        throw new Error('Invalid redirect URL: different origin')
      }
      /// remove the state to avoid a loop: we only redirect once
      localStorage.setItem(
        'oauth',
        JSON.stringify({ ...oAuthResult, state: null }),
      )
      window.location.href = url.href
    } catch (error) {
      /// silently ignore
      console.error(error)
    }
  }
}

function isTokenStillValid(oAuthResult: OAuthResult): boolean {
  const isValid = oAuthResult.accessTokenExpiresAt >= new Date()
  if (!isValid) {
    /// not authenticated or the token has expired
    localStorage.removeItem('oauth')
  }
  return isValid
}

/// see https://huggingface.co/spaces/huggingfacejs/client-side-oauth

/// check if the OAuth result is stored in the localStorage. It's synchronous.
export function getLocalOAuth(): OAuthResult | undefined {
  const storedOAuthResult = localStorage.getItem('oauth')
  if (!storedOAuthResult) {
    return
  }

  /// the OAuth result is stored in the localStorage
  /// the expiration date is stored as a string, we need to parse it
  const parsedOAuthResult = JSON.parse(storedOAuthResult) as Omit<OAuthResult, 'accessTokenExpiresAt'> & { accessTokenExpiresAt: string }
  const oAuthResult = {
    ...parsedOAuthResult,
    accessTokenExpiresAt: new Date(parsedOAuthResult.accessTokenExpiresAt),
  }

  if (!isTokenStillValid(oAuthResult)) {
    return
  }

  maybeRedirectToUrlBeforeLogin(oAuthResult)

  return oAuthResult
}

/// check the URL params, in case the user just logged in and was redirected back from the OAuth provider
/// if so, fetch the token and store it in the localStorage
export async function fetchOAuth(): Promise<OAuthResult | undefined> {
  const oAuthResult = await oauthHandleRedirectIfPresent()
  if (!oAuthResult || !isTokenStillValid(oAuthResult)) {
    return undefined
  }

  /// success: store the result
  localStorage.setItem('oauth', JSON.stringify(oAuthResult))

  maybeRedirectToUrlBeforeLogin(oAuthResult)

  return oAuthResult
}

export async function login() {
  // pass a state to be returned in the call to `oauthLogin` after the redirect
  const state = JSON.stringify({ urlBeforeLogin: window.location.href })
  const options = 'huggingface' in window
    ? {
      state,
      // default options work out of the box if the page runs in a HF space
    }
    : {
      state,
      redirectUrl: new URL(window.location.href).origin + '/',
      clientId: '9c9ac5a3-b324-4df8-a70c-7a8055ff8421',
      // TODO(SL): ^ don't hardcode the clientId (obtained by creating a developer app at https://huggingface.co/settings/connected-applications)
      scopes: 'openid profile read-repos',
    }
  // prompt=consent to re-trigger the consent screen instead of silently redirecting
  // Maybe it's annoying? If we remove it, it's faster, but we lose the ability to chose the orgs to share with
  // > option 1: always show (ie. include `prompt=consent` in the URL)
  // option 2: don't show it in Log In, but add an alternative link that uses `prompt=consent` (e.g. "Change the authorized orgs")
  // option 3: remove `prompt=consent` and let the user revoke the app in their settings (https://huggingface.co/settings/connected-applications)
  const url = await oauthLoginUrl(options) + '&prompt=consent'
  // redirect to the OAuth provider
  window.location.href = url
}

export function logout() {
  localStorage.removeItem('oauth')
  window.location.reload()
}
