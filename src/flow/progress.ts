import type { PublicFlowStep, PublicStepOption } from "../api/client";
import {
  formatBookingLabel,
  parseBookingSegment,
  type BookingSelection,
} from "./bookingSegment";

export type FlowSelection = {
  stepIndex: number;
  type: PublicFlowStep["type"];
  option: PublicStepOption | null;
  booking?: BookingSelection | null;
};

export type FlowProgress =
  | {
      status: "step";
      currentStepIndex: number;
      currentStep: PublicFlowStep;
      selections: FlowSelection[];
    }
  | {
      status: "complete";
      selections: FlowSelection[];
    }
  | {
      status: "invalid";
      message: string;
    };

function normalizeSegment(value: string) {
  return value.trim().toLowerCase();
}

function findOption(
  step: PublicFlowStep,
  segment: string,
): PublicStepOption | null {
  const needle = normalizeSegment(segment);
  return (
    step.options.find((item) => normalizeSegment(item.slug) === needle) ?? null
  );
}

/** Zoek vanaf `fromIndex` de eerstvolgende stap die dit URL-segment kan consumeren. */
function findStepForSegment(
  steps: PublicFlowStep[],
  fromIndex: number,
  segment: string,
): number | null {
  for (let index = fromIndex; index < steps.length; index += 1) {
    const step = steps[index]!;
    if (step.type === "CONFIRMATION") break;

    if (step.type === "SELLERS_AGENDA") {
      if (parseBookingSegment(segment)) return index;
      continue;
    }

    if (findOption(step, segment)) return index;
  }
  return null;
}

/**
 * Lost flow-voortgang op uit URL-segmenten.
 * Segmenten mogen direct naar een latere optie springen (tussenstappen overslaan),
 * zodat deep links zoals `/flow/bmw/belien-lommel` werken.
 */
export function resolveFlowProgress(
  steps: PublicFlowStep[],
  segments: string[],
): FlowProgress {
  const selections: FlowSelection[] = [];
  let segmentIndex = 0;
  let stepIndex = 0;

  while (stepIndex < steps.length) {
    const step = steps[stepIndex]!;

    if (step.type === "CONFIRMATION") {
      if (segmentIndex === segments.length) {
        return {
          status: "step",
          currentStepIndex: stepIndex,
          currentStep: step,
          selections,
        };
      }
      return {
        status: "invalid",
        message: "Deze flow-URL bevat te veel keuzes.",
      };
    }

    if (segmentIndex >= segments.length) {
      return {
        status: "step",
        currentStepIndex: stepIndex,
        currentStep: step,
        selections,
      };
    }

    const segment = segments[segmentIndex]!;
    const targetIndex = findStepForSegment(steps, stepIndex, segment);

    if (targetIndex == null) {
      return {
        status: "invalid",
        message: `Ongeldige keuze “${segment}” in deze flow.`,
      };
    }

    // Deep link: tussenliggende stappen overslaan zonder selectie.
    if (targetIndex > stepIndex) {
      stepIndex = targetIndex;
      continue;
    }

    if (step.type === "SELLERS_AGENDA") {
      const booking = parseBookingSegment(segment);
      if (!booking) {
        return {
          status: "invalid",
          message: `Ongeldige afspraakkeuze “${segment}” in deze flow.`,
        };
      }

      selections.push({
        stepIndex,
        type: step.type,
        option: {
          id: booking.sellerId ?? "any",
          name: formatBookingLabel(booking),
          slug: booking.slug,
          imageUrl: null,
        },
        booking,
      });
      segmentIndex += 1;
      stepIndex += 1;
      continue;
    }

    const option = findOption(step, segment);
    if (!option) {
      return {
        status: "invalid",
        message: `Ongeldige keuze “${segment}” in deze flow.`,
      };
    }

    selections.push({
      stepIndex,
      type: step.type,
      option,
    });
    segmentIndex += 1;
    stepIndex += 1;
  }

  if (segmentIndex < segments.length) {
    return {
      status: "invalid",
      message: "Deze flow-URL bevat te veel keuzes.",
    };
  }

  return {
    status: "complete",
    selections,
  };
}

export function flowPath(flowSlug: string, segments: string[]) {
  if (segments.length === 0) return `/flow/${flowSlug}`;
  return `/flow/${flowSlug}/${segments.join("/")}`;
}

export type FlowBreadcrumb = {
  label: string;
  to: string | null;
};

export function buildFlowBreadcrumbs(
  flowName: string,
  flowSlug: string,
  selections: FlowSelection[],
  _segments?: string[],
  options?: {
    confirmationLabel?: string | null;
    /** Op agenda: laatste keuze blijft aanklikbaar (deep link blijft geldig). */
    onAgenda?: boolean;
  },
): FlowBreadcrumb[] {
  const choiceSelections = selections.filter((selection) => selection.option);
  const confirmationLabel = options?.confirmationLabel?.trim() || null;
  const onAgenda = Boolean(options?.onAgenda);
  const pathSlugs = choiceSelections.map(
    (selection) => selection.option!.slug,
  );
  const atFlowRoot =
    pathSlugs.length === 0 && !confirmationLabel && !onAgenda;

  const crumbs: FlowBreadcrumb[] = [
    {
      label: "Home",
      to: "/",
    },
    {
      label: flowName,
      to: atFlowRoot ? null : flowPath(flowSlug, []),
    },
  ];

  choiceSelections.forEach((selection, index) => {
    const target = flowPath(flowSlug, pathSlugs.slice(0, index + 1));
    const isLast = index === choiceSelections.length - 1;
    const isCurrent = isLast && !confirmationLabel && !onAgenda;
    crumbs.push({
      label: selection.option!.name,
      to: isCurrent ? null : target,
    });
  });

  if (confirmationLabel) {
    crumbs.push({
      label: confirmationLabel,
      to: null,
    });
  }

  return crumbs;
}

export function selectionByType(
  selections: FlowSelection[],
  type: FlowSelection["type"],
) {
  return [...selections]
    .reverse()
    .find((selection) => selection.type === type && selection.option);
}

export type BookingStepResult = {
  index: number;
  type: FlowSelection["type"];
  name: string;
  slug: string;
};

/** 1-based resultstepN-waarden in flowvolgorde (niet-CONFIRMATION keuzes). */
export function buildBookingStepResults(
  selections: FlowSelection[],
): BookingStepResult[] {
  return selections
    .filter((selection) => selection.option)
    .map((selection, index) => ({
      index: index + 1,
      type: selection.type,
      name: selection.option!.name,
      slug: selection.option!.slug,
    }));
}
