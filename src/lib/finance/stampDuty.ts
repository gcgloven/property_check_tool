import { ABSD_RATES, BSD_BANDS, type BuyerProfile } from "./constants";
import type { Buyer } from "./types";

/**
 * Buyer's Stamp Duty (BSD) — tiered marginal rates on the purchase price.
 */
export function calcBSD(price: number): number {
  if (price <= 0) return 0;
  let bsd = 0;
  let prevCap = 0;
  for (const band of BSD_BANDS) {
    const taxableInBand = Math.min(price, band.upTo) - prevCap;
    if (taxableInBand > 0) bsd += taxableInBand * band.rate;
    prevCap = band.upTo;
    if (price <= band.upTo) break;
  }
  return bsd;
}

/**
 * Additional Buyer's Stamp Duty (ABSD) — flat rate on price by profile and nth purchase.
 * @param propertyCount the nth residential property this purchase represents (1, 2, or 3+).
 */
export function calcABSD(price: number, profile: BuyerProfile, propertyCount: number): number {
  if (price <= 0) return 0;
  const rates = ABSD_RATES[profile];
  const rate = propertyCount <= 1 ? rates.first : propertyCount === 2 ? rates.second : rates.third;
  return price * rate;
}

/** Total stamp duty payable (BSD + ABSD). */
export function calcStampDuty(price: number, profile: BuyerProfile, propertyCount: number): number {
  return calcBSD(price) + calcABSD(price, profile, propertyCount);
}

/** ABSD rate for a single buyer based on profile and nth purchase. */
export function absdRate(profile: BuyerProfile, propertyCount: number): number {
  const rates = ABSD_RATES[profile];
  return propertyCount <= 1 ? rates.first : propertyCount === 2 ? rates.second : rates.third;
}

/**
 * Joint ABSD rate for co-owners. Under SG rules, when a property is jointly
 * purchased, the highest applicable ABSD rate among all buyers applies to the
 * entire purchase price.
 */
export function jointAbsdRate(buyers: Buyer[]): number {
  if (buyers.length === 0) return 0;
  return Math.max(...buyers.map((b) => absdRate(b.profile, b.propertyCount)));
}

/** ABSD payable for a (possibly joint) purchase, using the highest applicable rate. */
export function calcABSDForBuyers(price: number, buyers: Buyer[]): number {
  if (price <= 0) return 0;
  return price * jointAbsdRate(buyers);
}
