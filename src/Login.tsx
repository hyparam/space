import {
  oauthLoginUrl,
  oauthHandleRedirectIfPresent,
  OAuthResult,
} from "@huggingface/hub";

// get token / oauth (check expiration date?)
// login
// logout

// see https://huggingface.co/spaces/huggingfacejs/client-side-oauth
export async function fetchOAuth(): Promise<OAuthResult | undefined> {
  let oauthResult: OAuthResult | false | null = JSON.parse(
    localStorage.getItem("oauth") ?? "null"
  ) as OAuthResult | false | null;
  oauthResult ||= await oauthHandleRedirectIfPresent();
  // check the date?
  console.log("oauthResult", oauthResult);

  if (oauthResult) {
    localStorage.setItem("oauth", JSON.stringify(oauthResult));
    return oauthResult;
  } else {
    const options = (
      !("huggingface" in window) ||
      !window.huggingface ||
      typeof window.huggingface !== "object" ||
      !("variables" in window.huggingface) ||
      !window.huggingface.variables ||
      typeof window.huggingface.variables !== "object" ||
      !("OAUTH_SCOPES" in window.huggingface.variables) ||
      !window.huggingface.variables.OAUTH_SCOPES ||
      typeof window.huggingface.variables.OAUTH_SCOPES !== "string" ||
      !("OAUTH_CLIENT_ID" in window.huggingface.variables) ||
      !window.huggingface.variables.OAUTH_CLIENT_ID ||
      typeof window.huggingface.variables.OAUTH_CLIENT_ID !== "string"
    ) ? {
      clientId: "921c40c6-531f-419e-9aa8-3d1cc2606e5e",// obtained by creating an app at https://huggingface.co/settings/applications
      // TODO(SL): don't hardcode the clientId
      scopes: "openid profile read-repos",
    } : {
      clientId: window.huggingface.variables.OAUTH_CLIENT_ID,
      scopes: window.huggingface.variables.OAUTH_SCOPES,
    }

    // prompt=consent to re-trigger the consent screen instead of silently redirecting
    window.location.href = (await oauthLoginUrl(options)) + "&prompt=consent";
  }
}

export async function fetchOAuthToken(): Promise<string> {
  const oauth = await fetchOAuth();
  if (!oauth) throw new Error("No oauth");
  return oauth.accessToken
}