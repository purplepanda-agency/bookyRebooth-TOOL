import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchBootstrap,
  type BootstrapResponse,
  type PublicFlow,
} from "../api/client";
import { mediaUrl } from "../config";
import { applyEntityTheme } from "../theme";
import { applyEntityTracking } from "../tracking";

type BootstrapState = {
  loading: boolean;
  error: string | null;
  entityName: string;
  logoUrl: string | null;
  introText: string;
  flows: PublicFlow[];
};

const BootstrapContext = createContext<BootstrapState | null>(null);

export function BootstrapProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityName, setEntityName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [introText, setIntroText] = useState(
    "Kies een bookingflow om te starten",
  );
  const [flows, setFlows] = useState<PublicFlow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data: BootstrapResponse = await fetchBootstrap();
        if (cancelled) return;
        applyEntityTheme(data.entity);
        applyEntityTracking({
          gtmId: data.entity.gtmId,
          headerScripts: data.entity.headerScripts,
          footerScripts: data.entity.footerScripts,
        });
        setEntityName(data.entity.name);
        setLogoUrl(mediaUrl(data.entity.logoUrl));
        setIntroText(
          data.entity.introText?.trim() ||
            "Kies een bookingflow om te starten",
        );
        setFlows(data.flows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Laden mislukt");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BootstrapContext.Provider
      value={{ loading, error, entityName, logoUrl, introText, flows }}
    >
      {children}
    </BootstrapContext.Provider>
  );
}

export function useBootstrap() {
  const value = useContext(BootstrapContext);
  if (!value) {
    throw new Error("useBootstrap must be used within BootstrapProvider");
  }
  return value;
}
