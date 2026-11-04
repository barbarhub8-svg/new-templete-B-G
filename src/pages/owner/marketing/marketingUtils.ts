import type { Offer } from "./marketingData";
import type { PosterData } from "./PosterCreator";

export function validateOffer(offer: Offer): string | null {
  if (!offer.title.trim()) return "Offer title is required.";
  if (!offer.code.trim()) return "Coupon code is required.";
  if (!/^[a-zA-Z0-9_-]+$/.test(offer.code.trim()))
    return "Coupon code may only contain letters, numbers, hyphens and underscores.";
  if (offer.start && !Number.isFinite(new Date(offer.start).getTime()))
    return "Enter a valid start date and time.";
  if (offer.end && !Number.isFinite(new Date(offer.end).getTime()))
    return "Enter a valid end date and time.";
  if (
    offer.start &&
    offer.end &&
    new Date(offer.end).getTime() <= new Date(offer.start).getTime()
  )
    return "End date must be after start date.";
  if (offer.type === "Percentage discount" && offer.value.trim() !== "") {
    const amount = Number(offer.value);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100)
      return "Percentage discount must be between 0 and 100.";
  }
  if (
    offer.type === "Fixed amount discount" &&
    offer.value.trim() !== "" &&
    (!Number.isFinite(Number(offer.value)) || Number(offer.value) < 0)
  )
    return "Fixed discount must be a non-negative number.";
  for (const [label, value] of [
    ["Minimum bill", offer.minimum],
    ["Maximum discount", offer.maximum],
  ] as const) {
    if (value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))
      return `${label} must be a non-negative number.`;
  }
  if (
    offer.limit.trim() &&
    (!Number.isInteger(Number(offer.limit)) || Number(offer.limit) < 1)
  )
    return "Usage limit must be a positive whole number.";
  return null;
}

export function posterForOffer(poster: PosterData, offer: Offer): PosterData {
  const discount =
    offer.type === "Percentage discount"
      ? `${offer.value}% OFF`
      : offer.type === "Fixed amount discount"
        ? `₹${offer.value} OFF`
        : offer.type;
  return {
    ...poster,
    title: offer.title,
    discount:
      offer.value ||
      !["Percentage discount", "Fixed amount discount"].includes(offer.type)
        ? discount
        : "SPECIAL OFFER",
    service: offer.services,
    validity: offer.end.slice(0, 10),
  };
}
