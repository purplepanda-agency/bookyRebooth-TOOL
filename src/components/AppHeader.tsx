import { Link } from "react-router-dom";
import { useBootstrap } from "../bootstrap/BootstrapContext";

export function AppHeader() {
  const { logoUrl } = useBootstrap();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" aria-label="Naar overzicht">
          {logoUrl ? (
            <img className="app-logo" src={logoUrl} alt="" />
          ) : (
            <div className="app-logo-fallback" aria-hidden="true" />
          )}
        </Link>
      </div>
    </header>
  );
}
