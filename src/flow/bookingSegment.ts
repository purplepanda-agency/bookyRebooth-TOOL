export type BookingSelection = {
  date: string;
  start: string;
  end: string;
  sellerId: string | null;
  slug: string;
};

const BOOKING_RE =
  /^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})_(\d{2})-(\d{2})_(any|[a-z0-9]+)$/i;

export function buildBookingSegment(input: {
  date: string;
  start: string;
  end: string;
  sellerId: string | null;
}) {
  const start = input.start.replace(":", "-");
  const end = input.end.replace(":", "-");
  const seller = input.sellerId || "any";
  return `${input.date}_${start}_${end}_${seller}`;
}

export function parseBookingSegment(slug: string): BookingSelection | null {
  const match = BOOKING_RE.exec(slug);
  if (!match) return null;

  const date = match[1]!;
  const start = `${match[2]}:${match[3]}`;
  const end = `${match[4]}:${match[5]}`;
  const sellerRaw = match[6]!.toLowerCase();
  const sellerId = sellerRaw === "any" ? null : sellerRaw;

  return {
    date,
    start,
    end,
    sellerId,
    slug,
  };
}

export function formatBookingDateLabel(booking: Pick<BookingSelection, "date">) {
  const [year, month, day] = booking.date.split("-").map(Number);
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year!, (month || 1) - 1, day || 1));
}

export function formatBookingLabel(booking: BookingSelection) {
  return `${formatBookingDateLabel(booking)} – ${booking.start} – ${booking.end}`;
}
