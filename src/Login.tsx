import {
  oauthLoginUrl,
  oauthHandleRedirectIfPresent,
  OAuthResult,
} from "@huggingface/hub";

// see https://huggingface.co/spaces/huggingfacejs/client-side-oauth
export async function checkLogin() {
  if (!("huggingface" in window)) {
    return null;
  }
  console.log("huggingface env", window.huggingface);
  let oauthResult: OAuthResult | false | null = JSON.parse(
    localStorage.getItem("oauth") ?? "null"
  ) as OAuthResult | false | null;
  oauthResult ||= await oauthHandleRedirectIfPresent();
  console.log("oauthResult", oauthResult);

  if (oauthResult) {
    localStorage.setItem("oauth", JSON.stringify(oauthResult));
  } else {
    if (
      !window.huggingface ||
      typeof window.huggingface !== "object" ||
      !("variables" in window.huggingface) ||
      !window.huggingface.variables ||
      typeof window.huggingface.variables !== "object" ||
      !("OAUTH_SCOPES" in window.huggingface.variables) ||
      !window.huggingface.variables.OAUTH_SCOPES ||
      typeof window.huggingface.variables.OAUTH_SCOPES !== "string"
    ) {
      throw new Error("Missing window.huggingface.variables.OAUTH_SCOPES");
    }
    const scopes = window.huggingface.variables.OAUTH_SCOPES;
    // prompt=consent to re-trigger the consent screen instead of silently redirecting
    window.location.href = (await oauthLoginUrl({ scopes })) + "&prompt=consent";
  }
}
