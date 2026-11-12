import { useEffect, useMemo, useState } from "react";
import {
  fetchAvailabilitySlots,
  type AvailabilitySeller,
  type AvailabilitySlot,
} from "../api/client";
import { mediaUrl } from "../config";
import {
  clampAgendaDate,
  formatDisplayDate,
  getDefaultAgendaDate,
  getMinSelectableDate,
  resolveDayStartHour,
} from "../flow/agendaDate";
import { SellerPickerModal } from "./SellerPickerModal";

type SellersAgendaStepProps = {
  locationSlug: string | null;
  categorySlug: string | null;
  onConfirm: (input: {
    date: string;
    start: string;
    end: string;
    sellerId: string | null;
  }) => void;
};

type SelectedSlot = {
  start: string;
  end: string;
  label: string;
};

const NO_PREFERENCE_LABEL = "Alle verkopers (geen voorkeur)";

export function SellersAgendaStep({
  locationSlug,
  categorySlug,
  onConfirm,
}: SellersAgendaStepProps) {
  const [date, setDate] = useState(() => getDefaultAgendaDate());
  const [minDate, setMinDate] = useState(() => getMinSelectableDate());
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [sellers, setSellers] = useState<AvailabilitySeller[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const nextMin = getMinSelectableDate();
      setMinDate(nextMin);
      setDate((current) => clampAgendaDate(current));
    };
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!locationSlug || !categorySlug) {
        setSellers([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setSelectedSlot(null);

      try {
        const data = await fetchAvailabilitySlots({
          location: locationSlug,
          category: categorySlug,
          date,
          dayStartHour: resolveDayStartHour(date),
        });
        if (cancelled) return;

        const availableSellers = data.sellers.filter(
          (seller) => seller.availableSlots.length > 0,
        );
        setSellers(availableSellers);
        setSellerId((current) =>
          current && availableSellers.some((seller) => seller.sellerId === current)
            ? current
            : null,
        );
      } catch (err) {
        if (!cancelled) {
          setSellers([]);
          setSellerId(null);
          setError(
            err instanceof Error
              ? err.message
              : "Beschikbaarheid laden mislukt",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [locationSlug, categorySlug, date]);

  const selectedSeller = useMemo(
    () => sellers.find((seller) => seller.sellerId === sellerId) ?? null,
    [sellers, sellerId],
  );

  const availableSlots = useMemo(() => {
    if (selectedSeller) {
      return selectedSeller.slots.filter((slot) => slot.available);
    }

    const byStart = new Map<string, AvailabilitySlot>();
    for (const seller of sellers) {
      for (const slot of seller.slots) {
        if (!slot.available) continue;
        if (!byStart.has(slot.start)) byStart.set(slot.start, slot);
      }
    }
    return [...byStart.values()].sort((a, b) => a.start.localeCompare(b.start));
  }, [sellers, selectedSeller]);

  if (!locationSlug || !categorySlug) {
    return (
      <div className="agenda-layout">
        <div className="state-box muted">
          <strong>Agenda niet beschikbaar</strong>
          <p style={{ marginTop: "0.75rem" }}>
            Voor deze stap zijn een locatie en categorie nodig in de flow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-layout">
      <section className="agenda-panel">
        <h2 className="agenda-panel-title">Kies een datum</h2>
        <label className="agenda-date-field">
          <span className="sr-only">Datum</span>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(event) => {
              const next = clampAgendaDate(event.target.value);
              setDate(next);
              setSelectedSlot(null);
            }}
          />
        </label>
        <p className="agenda-date-hint">{formatDisplayDate(date)}</p>
      </section>

      <section className="agenda-panel agenda-panel-seller">
        <div className="agenda-seller-main">
          <h2 className="agenda-panel-title">Kies een verkoper</h2>
          <button
            type="button"
            className="agenda-seller-trigger"
            onClick={() => setSellerModalOpen(true)}
            disabled={loading}
          >
            <span className="agenda-seller-label">
              {selectedSeller?.name ?? NO_PREFERENCE_LABEL}
            </span>
            <span className="agenda-seller-chevron" aria-hidden>
              ▾
            </span>
          </button>
        </div>
        {selectedSeller ? (
          mediaUrl(selectedSeller.imageUrl) ? (
            <img
              className="agenda-panel-avatar"
              src={mediaUrl(selectedSeller.imageUrl)!}
              alt=""
            />
          ) : (
            <span className="agenda-panel-avatar agenda-panel-avatar-fallback" aria-hidden>
              {selectedSeller.name.slice(0, 1).toUpperCase()}
            </span>
          )
        ) : null}
      </section>

      <section className="agenda-panel">
        <h2 className="agenda-panel-title">Beschikbare tijdsloten</h2>
        {!selectedSeller ? (
          <p className="agenda-panel-copy">
            Kies een tijdslot. Een verkoper wordt automatisch toegewezen.
          </p>
        ) : (
          <p className="agenda-panel-copy">
            Beschikbaarheid van {selectedSeller.name}.
          </p>
        )}

        {loading ? (
          <div className="agenda-slots-state muted">Beschikbaarheid laden…</div>
        ) : null}

        {!loading && error ? (
          <div className="agenda-slots-state error">{error}</div>
        ) : null}

        {!loading && !error && availableSlots.length === 0 ? (
          <div className="agenda-slots-state muted">
            Geen beschikbare tijdsloten op deze dag.
          </div>
        ) : null}

        {!loading && !error && availableSlots.length > 0 ? (
          <div className="agenda-slot-grid">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <button
                  key={`${slot.start}-${slot.end}`}
                  type="button"
                  className={`agenda-slot${isSelected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSelectedSlot({
                      start: slot.start,
                      end: slot.end,
                      label: slot.label,
                    });
                  }}
                >
                  {slot.start}
                </button>
              );
            })}
          </div>
        ) : null}

        <button
          type="button"
          className="agenda-confirm"
          disabled={!selectedSlot || loading}
          onClick={() => {
            if (!selectedSlot) return;
            onConfirm({
              date,
              start: selectedSlot.start,
              end: selectedSlot.end,
              sellerId,
            });
          }}
        >
          Bevestig keuze
        </button>
      </section>

      <SellerPickerModal
        open={sellerModalOpen}
        sellers={sellers}
        selectedSellerId={sellerId}
        onClose={() => setSellerModalOpen(false)}
        onSelect={(nextSellerId) => {
          setSellerId(nextSellerId);
          setSelectedSlot(null);
        }}
      />
    </div>
  );
}
