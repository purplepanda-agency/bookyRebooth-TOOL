import { CMS_URL, ENTITY_SLUG } from "../config";

export type PublicFlow = {
  id: string;
  name: string;
  slug: string;
  featuredImage: string | null;
};

export type BootstrapResponse = {
  entity: {
    name: string;
    slug: string;
    domain: string | null;
    logoUrl: string | null;
    introText: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    gtmId: string | null;
    headerScripts: string | null;
    footerScripts: string | null;
  };
  flows: PublicFlow[];
};

export type PublicStepType =
  | "FREE_CHOICE"
  | "PRODUCT_SET"
  | "LOCATIONS"
  | "CATEGORIES"
  | "SELLERS_AGENDA"
  | "CONFIRMATION";

export type PublicStepOption = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  address?: string | null;
};

export type PublicFlowStep = {
  id: string;
  type: PublicStepType;
  sortOrder: number;
  title: string | null;
  imageFit?: "contain" | "cover";
  options: PublicStepOption[];
};

export type PublicFlowDetailResponse = {
  flow: PublicFlow;
  steps: PublicFlowStep[];
};

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || response.statusText;
  } catch {
    return response.statusText || "Request failed";
  }
}

function publicUrl(path: string) {
  const host = window.location.host;
  const params = new URLSearchParams({ host });
  const withQuery = `${path}?${params}`;
  return import.meta.env.DEV || !CMS_URL
    ? withQuery
    : `${CMS_URL}${withQuery}`;
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  if (!ENTITY_SLUG) {
    throw new Error("VITE_ENTITY_SLUG ontbreekt in de omgeving");
  }

  const path = `/api/public/${encodeURIComponent(ENTITY_SLUG)}/bootstrap`;
  const response = await fetch(publicUrl(path));
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<BootstrapResponse>;
}

export async function fetchFlow(
  flowSlug: string,
): Promise<PublicFlowDetailResponse> {
  if (!ENTITY_SLUG) {
    throw new Error("VITE_ENTITY_SLUG ontbreekt in de omgeving");
  }

  const path = `/api/public/${encodeURIComponent(ENTITY_SLUG)}/flows/${encodeURIComponent(flowSlug)}`;
  const response = await fetch(publicUrl(path));
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<PublicFlowDetailResponse>;
}

export type AvailabilitySlot = {
  start: string;
  end: string;
  label: string;
  available: boolean;
};

export type AvailabilitySeller = {
  sellerId: string;
  name: string;
  imageUrl: string | null;
  workSchedule: {
    weekday: string;
    startTime: string;
    endTime: string;
  };
  slots: AvailabilitySlot[];
  availableSlots: string[];
};

export type AvailabilitySlotsResponse = {
  date: string;
  weekday: string;
  dayStartHour: number;
  location: { id: string; name: string; permalink: string };
  category: { id: string; name: string; slug: string };
  sellers: AvailabilitySeller[];
};

export async function fetchAvailabilitySlots(input: {
  location: string;
  category: string;
  date: string;
  dayStartHour?: number;
}): Promise<AvailabilitySlotsResponse> {
  if (!ENTITY_SLUG) {
    throw new Error("VITE_ENTITY_SLUG ontbreekt in de omgeving");
  }

  const path = `/api/public/${encodeURIComponent(ENTITY_SLUG)}/availability/slots`;
  const response = await fetch(publicUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<AvailabilitySlotsResponse>;
}

export type CreateBookingPayload = {
  location: string;
  category: string;
  date: string;
  start: string;
  end: string;
  sellerId: string | null;
  productName?: string | null;
  privacyAccepted: true;
  recaptchaToken: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address?: string;
    currentVehicle?: string;
    extraInfo?: string;
  };
};

export type CreatedBooking = {
  seller: {
    sellerId: string;
    name: string;
    imageUrl: string | null;
  };
  location: {
    id: string;
    name: string;
    permalink: string;
    address: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  date: string;
  start: string;
  end: string;
  customerName: string;
  productName: string | null;
  calendarEventId: string;
};

export async function createPublicBooking(
  input: CreateBookingPayload,
): Promise<CreatedBooking> {
  if (!ENTITY_SLUG) {
    throw new Error("VITE_ENTITY_SLUG ontbreekt in de omgeving");
  }

  const path = `/api/public/${encodeURIComponent(ENTITY_SLUG)}/bookings`;
  const response = await fetch(publicUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { booking: CreatedBooking };
  return data.booking;
}
