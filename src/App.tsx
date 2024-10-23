import Page from "./Page.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

export default function App() {
  console.log('url', window.location.href);
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
