const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatGBP(pence: number): string {
  return gbpFormatter.format(pence / 100);
}
