export type DeliveryZone = {
  id: string;
  name: string;
  postcodePrefixes: string[];
  deliveryFeePence: number;
  minOrderPence: number;
};

export type DeliveryQuoteResult = {
  serviceable: boolean;
  reason?: string;
  zoneName?: string;
  deliveryFeePence: number;
  minOrderPence: number;
  totalPence: number;
};

const DEFAULT_ZONE: DeliveryZone = {
  id: "london-default",
  name: "London",
  postcodePrefixes: ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"],
  deliveryFeePence: Number(process.env.DELIVERY_FEE_PENCE ?? 399),
  minOrderPence: Number(process.env.DELIVERY_MIN_ORDER_PENCE ?? 1500),
};

function normalizePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, "");
}

function normalizePrefix(prefix: string): string {
  return prefix.toUpperCase().replace(/\s+/g, "");
}

export function getDeliveryZones(): DeliveryZone[] {
  const raw = process.env.DELIVERY_ZONES_JSON?.trim();

  if (!raw) {
    return [DEFAULT_ZONE];
  }

  try {
    const parsed = JSON.parse(raw) as DeliveryZone[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_ZONE];
    }

    return parsed
      .filter((zone) =>
        zone &&
        typeof zone.id === "string" &&
        typeof zone.name === "string" &&
        Array.isArray(zone.postcodePrefixes) &&
        Number.isFinite(zone.deliveryFeePence) &&
        Number.isFinite(zone.minOrderPence),
      )
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        postcodePrefixes: zone.postcodePrefixes
          .map((value) => normalizePrefix(String(value)))
          .filter(Boolean),
        deliveryFeePence: Math.max(0, Math.round(zone.deliveryFeePence)),
        minOrderPence: Math.max(0, Math.round(zone.minOrderPence)),
      }))
      .filter((zone) => zone.postcodePrefixes.length > 0);
  } catch {
    return [DEFAULT_ZONE];
  }
}

export function findDeliveryZoneForPostcode(postcode: string): DeliveryZone | null {
  const normalizedPostcode = normalizePostcode(postcode);
  if (!normalizedPostcode) {
    return null;
  }

  const zones = getDeliveryZones();
  return (
    zones.find((zone) =>
      zone.postcodePrefixes.some((prefix) => normalizedPostcode.startsWith(prefix)),
    ) || null
  );
}

export function evaluateDeliveryQuote(
  subtotalPence: number,
  postcode: string,
): DeliveryQuoteResult {
  const zone = findDeliveryZoneForPostcode(postcode);
  if (!zone) {
    return {
      serviceable: false,
      reason: "This postcode is currently outside our delivery zones.",
      deliveryFeePence: 0,
      minOrderPence: 0,
      totalPence: subtotalPence,
    };
  }

  if (subtotalPence < zone.minOrderPence) {
    return {
      serviceable: false,
      reason: `Minimum order for ${zone.name} is £${(zone.minOrderPence / 100).toFixed(2)}.`,
      zoneName: zone.name,
      deliveryFeePence: zone.deliveryFeePence,
      minOrderPence: zone.minOrderPence,
      totalPence: subtotalPence + zone.deliveryFeePence,
    };
  }

  return {
    serviceable: true,
    zoneName: zone.name,
    deliveryFeePence: zone.deliveryFeePence,
    minOrderPence: zone.minOrderPence,
    totalPence: subtotalPence + zone.deliveryFeePence,
  };
}
