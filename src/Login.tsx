import {
  oauthLoginUrl,
  oauthHandleRedirectIfPresent,
  OAuthResult,
} from "@huggingface/hub";

// see https://huggingface.co/spaces/huggingfacejs/client-side-oauth
export async function fetchOAuth(): Promise<OAuthResult | false> {
  let oauthResult: OAuthResult | false | null = JSON.parse(
    localStorage.getItem("oauth") ?? "null"
  ) as OAuthResult | false | null;
  oauthResult ||= await oauthHandleRedirectIfPresent();
  
  if (oauthResult) {
    localStorage.setItem("oauth", JSON.stringify(oauthResult));
  }

  if (oauthResult && oauthResult.state) {
    try {
      const state: unknown = JSON.parse(oauthResult.state);
      if (
        typeof state !== "object" ||
        state === null ||
        !("redirect" in state)
      ) {
        throw new Error("Invalid state");
      }
      const redirect = state.redirect;
      if (!(typeof redirect === "string")) {
        throw new Error("Invalid redirect URL: not a string");
      }
      const url = new URL(redirect);
      if (url.origin !== window.location.origin) {
        throw new Error("Invalid redirect URL: different origin");
      }
      localStorage.setItem("oauth", JSON.stringify({...oauthResult, state: null}));
      // ^ avoid infinite loop
      window.location.href = url.href;
    } catch (error) {
      // silently ignore
      console.error(error);
    }
  }

  return oauthResult;
}

export async function login() {
  const options = {
    redirectUrl: new URL(window.location.href).origin + "/",
    // pass a state to be returned in the call to `oauthLogin` after the redirect
    state: JSON.stringify({ redirect: window.location.href }),
    ...("huggingface" in window
      ? {
          // static space: no need to pass clientId and scopes
        }
      : {
          clientId: "921c40c6-531f-419e-9aa8-3d1cc2606e5e", // obtained by creating an app at https://huggingface.co/settings/applications
          // TODO(SL): don't hardcode the clientId
          scopes: "openid profile read-repos",
        }),
  };
  // prompt=consent to re-trigger the consent screen instead of silently redirecting
  // TODO(SL): remove the consent screen? what does it mean?
  window.location.href = (await oauthLoginUrl(options)) + "&prompt=consent";
}

export function logout() {
  localStorage.removeItem("oauth");
  window.location.reload();
}
