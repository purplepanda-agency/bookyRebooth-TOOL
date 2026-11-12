import { Navigate, Route, Routes } from "react-router-dom";
import { BootstrapProvider } from "./bootstrap/BootstrapContext";
import { AppShell } from "./components/AppShell";
import { FlowPage } from "./pages/FlowPage";
import { HomePage } from "./pages/HomePage";

export function App() {
  return (
    <BootstrapProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/flow/:flowSlug/*" element={<FlowPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BootstrapProvider>
  );
}
