import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchFlow,
  type PublicFlow,
  type PublicFlowStep,
} from "../api/client";
import { useBootstrap } from "../bootstrap/BootstrapContext";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { ConfirmationStep } from "../components/ConfirmationStep";
import { FlowBreadcrumbs } from "../components/FlowBreadcrumbs";
import { SellersAgendaStep } from "../components/SellersAgendaStep";
import { buildBookingSegment } from "../flow/bookingSegment";
import {
  buildFlowBreadcrumbs,
  flowPath,
  resolveFlowProgress,
  selectionByType,
  type FlowBreadcrumb,
} from "../flow/progress";

export function FlowPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { entityName } = useBootstrap();
  const flowSlug = String(params.flowSlug || "")
    .trim()
    .toLowerCase();
  const choiceSegments = useMemo(
    () =>
      String(params["*"] || "")
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean),
    [params],
  );

  const [flow, setFlow] = useState<PublicFlow | null>(null);
  const [steps, setSteps] = useState<PublicFlowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!flowSlug) {
        setError("Flow niet gevonden");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchFlow(flowSlug);
        if (cancelled) return;
        setFlow(data.flow);
        setSteps(data.steps);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Laden mislukt");
          setFlow(null);
          setSteps([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [flowSlug]);

  const progress = useMemo(
    () => resolveFlowProgress(steps, choiceSegments),
    [steps, choiceSegments],
  );

  const breadcrumbs = useMemo<FlowBreadcrumb[]>(() => {
    if (!flow || progress.status === "invalid") return [];
    const onConfirmation =
      progress.status === "step" &&
      progress.currentStep.type === "CONFIRMATION";
    return buildFlowBreadcrumbs(
      flow.name,
      flow.slug,
      progress.selections,
      choiceSegments,
      {
        confirmationLabel: onConfirmation
          ? progress.currentStep.title?.trim() || "Formulier"
          : null,
      },
    );
  }, [flow, progress, choiceSegments]);

  if (loading) {
    return (
      <main className="home-main">
        <div className="state-box muted">Flow laden…</div>
      </main>
    );
  }

  if (error || !flow) {
    return (
      <main className="home-main">
        <div className="state-box error">
          <strong>Flow niet beschikbaar</strong>
          <p style={{ marginTop: "0.75rem" }}>{error || "Onbekende fout"}</p>
          <p style={{ marginTop: "1rem" }}>
            <Link to="/">Terug naar overzicht</Link>
          </p>
        </div>
      </main>
    );
  }

  if (progress.status === "invalid") {
    return (
      <main className="home-main">
        <div className="state-box error">
          <strong>Ongeldige keuze</strong>
          <p style={{ marginTop: "0.75rem" }}>{progress.message}</p>
          <p style={{ marginTop: "1rem" }}>
            <Link to={flowPath(flow.slug, [])}>Opnieuw starten</Link>
          </p>
        </div>
      </main>
    );
  }

  if (progress.status === "complete") {
    return (
      <main className="home-main home-main-step">
        <FlowBreadcrumbs items={breadcrumbs} />
        <div className="state-box muted">
          <strong>Einde van deze flow</strong>
          <p style={{ marginTop: "0.75rem" }}>
            Alle stappen zijn doorlopen.
          </p>
          <p style={{ marginTop: "1rem" }}>
            <Link to="/">Terug naar overzicht</Link>
          </p>
        </div>
      </main>
    );
  }

  const { currentStep, selections } = progress;
  const locationSelection = selectionByType(selections, "LOCATIONS");
  const categorySelection = selectionByType(selections, "CATEGORIES");
  const productSelection = selectionByType(selections, "PRODUCT_SET");
  const bookingSelection = [...selections]
    .reverse()
    .find((selection) => selection.type === "SELLERS_AGENDA" && selection.booking);

  if (currentStep.type === "SELLERS_AGENDA") {
    return (
      <main className="home-main home-main-agenda">
        <div className="step-heading">
          <FlowBreadcrumbs items={breadcrumbs} />
        </div>
        <SellersAgendaStep
          locationSlug={locationSelection?.option?.slug ?? null}
          categorySlug={categorySelection?.option?.slug ?? null}
          onConfirm={(input) => {
            const segment = buildBookingSegment(input);
            navigate(flowPath(flow.slug, [...choiceSegments, segment]));
          }}
        />
      </main>
    );
  }

  if (currentStep.type === "CONFIRMATION") {
    if (!bookingSelection?.booking) {
      return (
        <main className="home-main">
          <div className="state-box error">
            <strong>Afspraak ontbreekt</strong>
            <p style={{ marginTop: "0.75rem" }}>
              Kies eerst een datum en tijdslot.
            </p>
            <p style={{ marginTop: "1rem" }}>
              <Link to={flowPath(flow.slug, choiceSegments.slice(0, -1) || [])}>
                Terug naar agenda
              </Link>
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="home-main home-main-confirm">
        <div className="step-heading">
          <FlowBreadcrumbs items={breadcrumbs} />
        </div>
        <ConfirmationStep
          formTitle={currentStep.title?.trim() || "Persoonlijke gegevens"}
          entityName={entityName}
          booking={bookingSelection.booking}
          location={locationSelection?.option ?? null}
          category={categorySelection?.option ?? null}
          product={productSelection?.option ?? null}
          locationSlug={locationSelection?.option?.slug ?? null}
          categorySlug={categorySelection?.option?.slug ?? null}
        />
      </main>
    );
  }

  const variant = currentStep.type === "PRODUCT_SET" ? "products" : "default";
  const stepTitle =
    currentStep.type === "CATEGORIES" ||
    currentStep.type === "LOCATIONS" ||
    currentStep.type === "PRODUCT_SET"
      ? currentStep.title?.trim() || null
      : null;

  return (
    <main className="home-main home-main-step">
      <div className="step-heading">
        <FlowBreadcrumbs items={breadcrumbs} />
        {stepTitle ? <p className="home-intro">{stepTitle}</p> : null}
      </div>
      <ChoiceGrid
        options={currentStep.options}
        variant={variant}
        showAddress={currentStep.type === "LOCATIONS"}
        imageFit={currentStep.imageFit ?? "contain"}
        toOption={(option) =>
          flowPath(flow.slug, [...choiceSegments, option.slug])
        }
      />
    </main>
  );
}
