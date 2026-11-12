import { Outlet } from "react-router-dom";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export function AppShell() {
  return (
    <div className="app-shell">
      <AppHeader />
      <Outlet />
      <AppFooter />
    </div>
  );
}
