import Page from "./Page.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
