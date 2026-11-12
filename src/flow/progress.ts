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

function stepNeedsChoice(step: PublicFlowStep) {
  return step.type !== "CONFIRMATION";
}

export function resolveFlowProgress(
  steps: PublicFlowStep[],
  segments: string[],
): FlowProgress {
  const selections: FlowSelection[] = [];
  let segmentIndex = 0;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
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

    if (step.type === "SELLERS_AGENDA") {
      if (segmentIndex >= segments.length) {
        return {
          status: "step",
          currentStepIndex: stepIndex,
          currentStep: step,
          selections,
        };
      }

      const slug = segments[segmentIndex]!;
      const booking = parseBookingSegment(slug);
      if (!booking) {
        return {
          status: "invalid",
          message: `Ongeldige afspraakkeuze “${slug}” in deze flow.`,
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
      continue;
    }

    if (!stepNeedsChoice(step)) {
      if (segmentIndex === segments.length) {
        return {
          status: "step",
          currentStepIndex: stepIndex,
          currentStep: step,
          selections,
        };
      }

      selections.push({
        stepIndex,
        type: step.type,
        option: null,
      });
      continue;
    }

    if (segmentIndex >= segments.length) {
      return {
        status: "step",
        currentStepIndex: stepIndex,
        currentStep: step,
        selections,
      };
    }

    const slug = segments[segmentIndex]!;
    const option = step.options.find((item) => item.slug === slug) ?? null;
    if (!option) {
      return {
        status: "invalid",
        message: `Ongeldige keuze “${slug}” in deze flow.`,
      };
    }

    selections.push({
      stepIndex,
      type: step.type,
      option,
    });
    segmentIndex += 1;
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
  segments: string[],
  options?: { confirmationLabel?: string | null },
): FlowBreadcrumb[] {
  const choiceSelections = selections.filter((selection) => selection.option);
  const confirmationLabel = options?.confirmationLabel?.trim() || null;
  const crumbs: FlowBreadcrumb[] = [
    {
      label: "Home",
      to: "/",
    },
    {
      label: flowName,
      to: segments.length === 0 ? null : flowPath(flowSlug, []),
    },
  ];

  choiceSelections.forEach((selection, index) => {
    const target = flowPath(flowSlug, segments.slice(0, index + 1));
    const isCurrent =
      !confirmationLabel && index === choiceSelections.length - 1;
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
