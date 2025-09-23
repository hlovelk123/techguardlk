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

export function formatDate(input: Date | string | number) {
  const date = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(input: Date | string | number) {
  const date = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
