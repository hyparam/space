import { oauthLoginUrl, oauthHandleRedirectIfPresent, OAuthResult } from "@huggingface/hub";

export async function checkLogin() {
    if (!("huggingface" in window)) {
        return null;
    }
    console.log("huggingface env", window.huggingface);
    let oauthResult: OAuthResult | false | null = JSON.parse(localStorage.getItem("oauth") ?? "null") as OAuthResult | false | null;    
    oauthResult ||= await oauthHandleRedirectIfPresent();
    
    if (oauthResult) {
        localStorage.setItem("oauth", JSON.stringify(oauthResult));
    } else {        
        // prompt=consent to re-trigger the consent screen instead of silently redirecting
        window.location.href = (await oauthLoginUrl({scopes: window?.huggingface?.variables?.OAUTH_SCOPES})) + "&prompt=consent";          
    }
}


// <!DOCTYPE html>
// <html>
// 	<head>
// 		<meta charset="utf-8" />
// 		<meta name="viewport" content="width=device-width" />
// 		<title>My static Space</title>
// 		<link rel="stylesheet" href="style.css" />
//         <script src="https://unpkg.com/es-module-shims@1.7.0/dist/es-module-shims.js"></script>
// 		<script type="importmap">
// 			{
// 				"imports": {
// 					"@huggingface/hub": "https://cdn.jsdelivr.net/npm/@huggingface/hub@0.13.0/+esm"
// 				}
// 			}
// 		</script>
// 	</head>
// 	<body>
//       <div class="card" style="margin-bottom: 2rem;">
//         <h1>OAuth in a static Space</h1>
//         <p>Checkout the <a href="https://huggingface.co/spaces/huggingfacejs/client-side-oauth/blob/main/index.html" target="_blank">index.html</a> file to see the few lines of code
//         enabling this space</p>
//         <p>After clicking "Signin with HF", you will be redirected to this space and the access token + user info will be displayed.</p>
//       </div>
//       <img src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-xl-dark.svg" alt="Sign in with Hugging Face" style="cursor: pointer; display: none;" id="signin">
//       <button id="signout" style="display: none">Sign out</button>
//       <pre>
        
//       </pre>
//       <script type="module">
//         import { oauthLoginUrl, oauthHandleRedirectIfPresent } from "@huggingface/hub";
//         console.log("huggingface env", window.huggingface);
//         let oauthResult = localStorage.getItem("oauth");
//         if (oauthResult) {
//           try {
//             oauthResult = JSON.parse(oauthResult);
//           } catch {
//             oauthResult = null;
//           }
//         }
        
//         oauthResult ||= await oauthHandleRedirectIfPresent();
//         if (oauthResult) {
//           document.querySelector("pre").textContent = JSON.stringify(oauthResult, null, 2);
//           localStorage.setItem("oauth", JSON.stringify(oauthResult));
//           document.getElementById("signout").style.removeProperty("display");
//           document.getElementById("signout").onclick = async function() {
//             localStorage.removeItem("oauth");
//             window.location.href = window.location.href.replace(/\?.*$/, '');
//             window.location.reload();
//           }
//         } else {
//           document.getElementById("signin").style.removeProperty("display");
//           document.getElementById("signin").onclick = async function() {
//             // prompt=consent to re-trigger the consent screen instead of silently redirecting
//             window.location.href = (await oauthLoginUrl({scopes: window.huggingface.variables.OAUTH_SCOPES})) + "&prompt=consent";
//           }
//         }
//       </script>
// 	</body>
// </html>

