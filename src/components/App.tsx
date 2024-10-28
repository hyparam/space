import Page from "./Page.tsx";
import AuthProvider from "./context/AuthProvider.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
