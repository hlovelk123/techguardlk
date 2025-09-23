const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatCurrency(cents: number) {
  return usdFormatter.format(cents / 100);
}

export function formatSeatCapacity(seats: number) {
  return seats === 1 ? "1 seat" : `${seats} seats`;
}
