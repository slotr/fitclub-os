const SYMBOL: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function currencySymbol(code: string): string {
  return SYMBOL[code.toUpperCase()] ?? `${code} `;
}

export function formatMoney(amountMinor: number, code: string): string {
  const symbol = currencySymbol(code);
  const value = amountMinor / 100;
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
  return `${symbol}${formatted}`;
}

export function formatMoneyShort(amountMinor: number, code: string): string {
  const value = amountMinor / 100;
  const symbol = currencySymbol(code);
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
  return `${symbol}${value.toFixed(0)}`;
}
