import { Link } from "react-router-dom";
import { useBootstrap } from "../bootstrap/BootstrapContext";
import { ENTITY_SLUG, mediaUrl } from "../config";

export function HomePage() {
  const { loading, error, introText, flows } = useBootstrap();

  if (loading) {
    return (
      <main className="home-main">
        <div className="state-box muted">Booking laden…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="home-main">
        <div className="state-box error">
          <strong>Kan niet starten</strong>
          <p style={{ marginTop: "0.75rem" }}>{error}</p>
          <p style={{ marginTop: "0.75rem", color: "var(--muted)" }}>
            Entiteit: <code>{ENTITY_SLUG || "(niet gezet)"}</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="home-main">
      <p className="home-intro">{introText}</p>

      {flows.length === 0 ? (
        <div className="state-box muted">
          Er zijn nog geen actieve flows voor deze entiteit.
        </div>
      ) : (
        <div className="flow-grid">
          {flows.map((flow) => {
            const image = mediaUrl(flow.featuredImage);
            return (
              <Link
                key={flow.id}
                className="flow-card"
                to={`/flow/${flow.slug}`}
              >
                {image ? (
                  <img className="flow-card-image" src={image} alt="" />
                ) : (
                  <div className="flow-card-image placeholder">
                    Geen afbeelding
                  </div>
                )}
                <div className="flow-card-body">
                  <h2>{flow.name}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
