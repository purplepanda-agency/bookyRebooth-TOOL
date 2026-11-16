import { useBootstrap } from "../bootstrap/BootstrapContext";

export function MaintenancePage() {
  const { entityName } = useBootstrap();

  return (
    <main className="home-main">
      <div className="not-found-box">
        <h1 className="not-found-title">Coming soon</h1>
        <p className="not-found-text">
          {entityName
            ? `De online afspraakmodule van ${entityName} is tijdelijk in onderhoud.`
            : "De online afspraakmodule is tijdelijk in onderhoud."}{" "}
          Kom later nog eens terug.
        </p>
      </div>
    </main>
  );
}
