import {
  oauthLoginUrl,
  oauthHandleRedirectIfPresent,
  OAuthResult,
} from "@huggingface/hub";

export async function checkLogin() {
  if (!("huggingface" in window)) {
    return null;
  }
  console.log("huggingface env", window.huggingface);
  let oauthResult: OAuthResult | false | null = JSON.parse(
    localStorage.getItem("oauth") ?? "null"
  ) as OAuthResult | false | null;
  oauthResult ||= await oauthHandleRedirectIfPresent();

  if (oauthResult) {
    localStorage.setItem("oauth", JSON.stringify(oauthResult));
  } else {
    // prompt=consent to re-trigger the consent screen instead of silently redirecting

    // @ts-expect-error window.huggingface is defined inside static Spaces.
    const variables: Record<string, string> | null = (window.huggingface?.variables ?? null) as Record<string, string> | null;
    window.location.href =
      (await oauthLoginUrl({ scopes: variables?.OAUTH_SCOPES })) +
      "&prompt=consent";
  }
}
