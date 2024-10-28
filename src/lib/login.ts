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

  if (oauthResult && (new Date(oauthResult.accessTokenExpiresAt) < new Date())) {
    console.warn("Access token expired");
    localStorage.removeItem("oauth");
    return false;
  }

  if (oauthResult) {
    localStorage.setItem("oauth", JSON.stringify(oauthResult));
  }

  if (oauthResult && oauthResult.state) {
    try {
      const state: unknown = JSON.parse(oauthResult.state);
      if (
        typeof state !== "object" ||
        state === null ||
        !("urlBeforeLogin" in state)
      ) {
        throw new Error("Invalid state");
      }
      const urlBeforeLogin = state.urlBeforeLogin;
      if (!(typeof urlBeforeLogin === "string")) {
        throw new Error("Invalid redirect URL: not a string");
      }
      const url = new URL(urlBeforeLogin);
      if (url.origin !== window.location.origin) {
        throw new Error("Invalid redirect URL: different origin");
      }
      localStorage.setItem(
        "oauth",
        JSON.stringify({ ...oauthResult, state: null })
      );
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
  // pass a state to be returned in the call to `oauthLogin` after the redirect
  const state = JSON.stringify({ urlBeforeLogin: window.location.href });
  const options = {
    state,
    ...("huggingface" in window
      ? // default options work out of the box for HF spaces
        undefined
      : {
          state,
          redirectUrl: new URL(window.location.href).origin + "/",
          clientId: "921c40c6-531f-419e-9aa8-3d1cc2606e5e",
          // TODO(SL): ^ don't hardcode the clientId (obtained by creating an app at https://huggingface.co/settings/applications)
          scopes: "openid profile read-repos",
        }),
  };
  // prompt=consent to re-trigger the consent screen instead of silently redirecting
  // Maybe it's annoying? If we remove it, it's faster, but we lose the ability to chose the orgs to share with
  // > option 1: always show (ie. include `prompt=consent` in the URL)
  // option 2: don't show it in Log In, but add an alternative link that uses `prompt=consent` (e.g. "Change the authorized orgs")
  // option 3: remove `prompt=consent` and let the user revoke the app in their settings (https://huggingface.co/settings/applications)
  const url = (await oauthLoginUrl(options)) + "&prompt=consent";
  window.location.href = url;
}

export function logout() {
  localStorage.removeItem("oauth");
  window.location.reload();
}
