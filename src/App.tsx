import Page from "./Page.tsx";
import { AuthProvider } from "./contexts/Providers.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
