import type { AIResult } from "./AIGenerator";

export interface AIOptions {
  goal: string;
  customer: string;
  occasion: string;
  services: string;
  discount: string;
  validity: string;
  language: string;
  tone: string;
}
/** Deterministic, local copy generation for preview purposes only. */
export function generateMockOffer(
  options: AIOptions,
  variation: number,
): AIResult {
  const occasion = options.occasion === "None" ? "" : options.occasion;
  const titleOptions = occasion
    ? [`${occasion} Glow Special`, `Celebrate ${occasion} with care`]
    : ["A little more time for you", "Your next feel-good moment"];
  const title = titleOptions[variation % titleOptions.length];
  const opening =
    options.language === "Hindi"
      ? `${options.services} पर ${options.discount} का आनंद लें। ${options.validity} तक मान्य।`
      : options.language === "Hinglish"
        ? `${options.services} par ${options.discount} ka treat! ${options.validity} tak valid.`
        : `Enjoy ${options.discount} on ${options.services}. Valid for ${options.validity}.`;
  const closing =
    options.language === "Hindi"
      ? "अपनी अगली विज़िट बुक करें।"
      : options.language === "Hinglish"
        ? "Apni next visit book karein!"
        : "Book your next visit today.";
  const tone =
    options.tone === "Playful" ? " ✨" : options.tone === "Luxury" ? " ✦" : "";
  const codeBase = (occasion || options.goal.split(" ")[0] || "GLOW")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return {
    title,
    short: opening,
    whatsapp: `${title}\n\n${opening}\n${closing}${tone}`,
    instagram: `${title}${tone}\n\n${opening}\n${closing}\n#SelfCare #Salon`,
    facebook: `${title}\n\n${opening}\n${closing}${tone}`,
    x: `${title} — ${opening} ${closing}${tone}`,
    code: `${codeBase || "GLOW"}${variation % 2 ? "15" : "20"}`,
    terms: `For ${options.customer.toLowerCase()}. Subject to availability and service eligibility. Cannot be combined with other offers.`,
  };
}
