import { Navigate, Route, Routes } from "react-router-dom";
import { BootstrapProvider, useBootstrap } from "./bootstrap/BootstrapContext";
import { AppShell } from "./components/AppShell";
import { FlowPage } from "./pages/FlowPage";
import { HomePage } from "./pages/HomePage";
import { MaintenancePage } from "./pages/MaintenancePage";

function AppRoutes() {
  const { loading, error, maintenanceMode } = useBootstrap();

  if (loading) {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="*"
            element={
              <main className="home-main">
                <div className="state-box muted">Booking laden…</div>
              </main>
            }
          />
        </Route>
      </Routes>
    );
  }

  if (error) {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="*"
            element={
              <main className="home-main">
                <div className="state-box error">
                  <strong>Kan niet starten</strong>
                  <p style={{ marginTop: "0.75rem" }}>{error}</p>
                </div>
              </main>
            }
          />
        </Route>
      </Routes>
    );
  }

  if (maintenanceMode) {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<MaintenancePage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/flow/:flowSlug/*" element={<FlowPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BootstrapProvider>
      <AppRoutes />
    </BootstrapProvider>
  );
}
