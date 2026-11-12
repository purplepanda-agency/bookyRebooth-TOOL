import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createPublicBooking,
  fetchAvailabilitySlots,
  type AvailabilitySeller,
  type CreatedBooking,
  type PublicStepOption,
} from "../api/client";
import { mediaUrl } from "../config";
import {
  formatBookingLabel,
  type BookingSelection,
} from "../flow/bookingSegment";
import { resolveDayStartHour } from "../flow/agendaDate";
import { getBookingRecaptchaToken } from "../lib/recaptcha";

type ConfirmationStepProps = {
  formTitle: string;
  entityName: string;
  booking: BookingSelection;
  location: PublicStepOption | null;
  category: PublicStepOption | null;
  product: PublicStepOption | null;
  locationSlug: string | null;
  categorySlug: string | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  currentVehicle: string;
  extraInfo: string;
  privacyAccepted: boolean;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  currentVehicle: "",
  extraInfo: "",
  privacyAccepted: false,
};

/** Stabiele keuze uit beschikbare verkopers voor hetzelfde tijdslot. */
function pickAssignedSeller(
  candidates: AvailabilitySeller[],
  booking: BookingSelection,
) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  const key = `${booking.date}|${booking.start}|${booking.end}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return candidates[hash % candidates.length]!;
}

export function ConfirmationStep({
  formTitle,
  entityName,
  booking,
  location,
  category,
  product,
  locationSlug,
  categorySlug,
}: ConfirmationStepProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [seller, setSeller] = useState<AvailabilitySeller | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSeller() {
      if (!locationSlug || !categorySlug) {
        setSeller(null);
        return;
      }

      setLoadingSeller(true);
      try {
        const data = await fetchAvailabilitySlots({
          location: locationSlug,
          category: categorySlug,
          date: booking.date,
          dayStartHour: resolveDayStartHour(booking.date),
        });
        if (cancelled) return;

        const forSlot = (item: AvailabilitySeller) =>
          item.slots.some(
            (slot) =>
              slot.available &&
              slot.start === booking.start &&
              slot.end === booking.end,
          );

        if (booking.sellerId) {
          const preferred =
            data.sellers.find(
              (item) => item.sellerId === booking.sellerId && forSlot(item),
            ) ??
            data.sellers.find((item) => item.sellerId === booking.sellerId) ??
            null;
          setSeller(preferred);
          return;
        }

        const candidates = data.sellers.filter(forSlot);
        setSeller(pickAssignedSeller(candidates, booking) ?? null);
      } catch {
        if (!cancelled) setSeller(null);
      } finally {
        if (!cancelled) setLoadingSeller(false);
      }
    }

    void loadSeller();
    return () => {
      cancelled = true;
    };
  }, [
    booking.date,
    booking.start,
    booking.end,
    booking.sellerId,
    locationSlug,
    categorySlug,
  ]);

  const sellerName = useMemo(() => {
    if (seller?.name) return seller.name;
    return loadingSeller ? "Laden…" : "Verkoper";
  }, [seller, loadingSeller]);

  const sellerImage = mediaUrl(seller?.imageUrl);
  const productImage = mediaUrl(product?.imageUrl);
  const showProduct = Boolean(product) && product!.slug !== "no-product";
  const slotLabel = formatBookingLabel(booking);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      setError("Vul alle verplichte velden in.");
      return;
    }
    if (!form.privacyAccepted) {
      setError("Je moet akkoord gaan met de Privacy Policy.");
      return;
    }
    if (!locationSlug || !categorySlug) {
      setError("Locatie of categorie ontbreekt voor deze booking.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const recaptchaToken = await getBookingRecaptchaToken();
      const bookingResult = await createPublicBooking({
        location: locationSlug,
        category: categorySlug,
        date: booking.date,
        start: booking.start,
        end: booking.end,
        sellerId: booking.sellerId ?? seller?.sellerId ?? null,
        productName: showProduct ? product!.name : null,
        privacyAccepted: true,
        recaptchaToken,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          currentVehicle: form.currentVehicle.trim(),
          extraInfo: form.extraInfo.trim(),
        },
      });
      setCreated(bookingResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Afspraak bevestigen mislukt",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const thanksImage = mediaUrl(created.seller.imageUrl);
    return (
      <div className="confirm-layout confirm-layout-thanks">
        <h1 className="confirm-page-title">Bedankt voor je afspraak</h1>
        <p className="confirm-thanks-lead">
          Je afspraak is bevestigd. Dit zijn de details:
        </p>

        <div
          className={`confirm-thanks-grid${created.productName ? " confirm-thanks-grid-with-product" : ""}`}
        >
          <article className="confirm-card confirm-thanks-details">
            <div className="confirm-card-hero confirm-card-hero-seller">
              {thanksImage ? (
                <img
                  className="confirm-seller-avatar"
                  src={thanksImage}
                  alt=""
                />
              ) : (
                <span className="confirm-seller-avatar confirm-seller-avatar-fallback">
                  {created.seller.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="confirm-card-body">
              <h2>
                {created.seller.name}
                {entityName ? ` – ${entityName}` : ""}
              </h2>
              <p>Locatie: {created.location.name}</p>
              {created.location.address ? (
                <p>{created.location.address}</p>
              ) : null}
              <p>
                Tijdslot:{" "}
                {formatBookingLabel({
                  date: created.date,
                  start: created.start,
                  end: created.end,
                  sellerId: created.seller.sellerId,
                  slug: "",
                })}
              </p>
              <p>Op naam van: {created.customerName}</p>
            </div>
          </article>

          {created.productName ? (
            <article className="confirm-card confirm-thanks-product">
              {productImage ? (
                <img
                  className="confirm-card-media"
                  src={productImage}
                  alt=""
                />
              ) : (
                <div className="confirm-card-media placeholder">Geen foto</div>
              )}
              <div className="confirm-card-body">
                <h2>{created.productName}</h2>
                <p className="muted">{created.category.name}</p>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-layout">
      <h1 className="confirm-page-title">Bevestig uw afspraak</h1>

      <div className="confirm-grid">
        <aside className="confirm-summary">
          <article className="confirm-card">
            <div className="confirm-card-hero confirm-card-hero-seller">
              {sellerImage ? (
                <img
                  className="confirm-seller-avatar"
                  src={sellerImage}
                  alt=""
                />
              ) : (
                <span className="confirm-seller-avatar confirm-seller-avatar-fallback">
                  {sellerName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="confirm-card-body">
              <h2>
                {sellerName}
                {entityName ? ` – ${entityName}` : ""}
              </h2>
              {location ? <p>Locatie: {location.name}</p> : null}
              {location?.address ? <p>{location.address}</p> : null}
              <p>Tijdslot: {slotLabel}</p>
            </div>
          </article>

          {showProduct ? (
            <article className="confirm-card">
              {productImage ? (
                <img
                  className="confirm-card-media"
                  src={productImage}
                  alt=""
                />
              ) : (
                <div className="confirm-card-media placeholder">Geen foto</div>
              )}
              <div className="confirm-card-body">
                <h2>{product!.name}</h2>
                {category ? <p className="muted">{category.name}</p> : null}
              </div>
            </article>
          ) : null}
        </aside>

        <section className="confirm-form-panel">
          <h2 className="confirm-form-title">
            {formTitle || "Persoonlijke gegevens"}
          </h2>
          <form className="confirm-form" onSubmit={(e) => void onSubmit(e)}>
            <label>
              Voornaam *
              <input
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
            </label>
            <label>
              Naam *
              <input
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
            </label>
            <label>
              Telefoon Nummer *
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
              />
            </label>
            <label>
              E-mailadres *
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </label>
            <label>
              Adres
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </label>
            <label>
              Huidig voertuig + nummerplaat
              <input
                value={form.currentVehicle}
                onChange={(e) => updateField("currentVehicle", e.target.value)}
              />
            </label>
            <label>
              Extra Info
              <textarea
                rows={4}
                value={form.extraInfo}
                onChange={(e) => updateField("extraInfo", e.target.value)}
              />
            </label>

            <label className="confirm-privacy">
              <input
                type="checkbox"
                checked={form.privacyAccepted}
                onChange={(e) =>
                  updateField("privacyAccepted", e.target.checked)
                }
              />
              <span>Ik ga akkoord met de Privacy Policy</span>
            </label>

            {error ? <p className="confirm-form-error">{error}</p> : null}

            <button
              type="submit"
              className="confirm-submit"
              disabled={submitting || loadingSeller}
            >
              {submitting ? "Bevestigen…" : "Versturen"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
