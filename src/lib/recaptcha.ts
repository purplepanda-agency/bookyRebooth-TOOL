import { RECAPTCHA_SITE_KEY } from "../config";

const SCRIPT_ID = "booky-recaptcha-v3";
const EXPECTED_ACTION = "booking";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function loadRecaptchaScript(siteKey: string) {
  if (document.getElementById(SCRIPT_ID)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("reCAPTCHA script laden mislukt"));
    document.head.appendChild(script);
  });
}

export async function getBookingRecaptchaToken(): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) {
    throw new Error("VITE_RECAPTCHA_SITE_KEY ontbreekt in de omgeving");
  }

  await loadRecaptchaScript(RECAPTCHA_SITE_KEY);

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) {
    throw new Error("reCAPTCHA is niet beschikbaar");
  }

  await new Promise<void>((resolve) => {
    grecaptcha.ready(() => resolve());
  });

  const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {
    action: EXPECTED_ACTION,
  });

  if (!token) {
    throw new Error("reCAPTCHA-token ontbreekt");
  }

  return token;
}
