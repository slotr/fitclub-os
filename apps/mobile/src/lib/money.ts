const SYMBOL: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function currencySymbol(code: string): string {
  return SYMBOL[code.toUpperCase()] ?? `${code} `;
}

export function formatMoney(amount: number, code: string): string {
  const sign = currencySymbol(code);
  return `${sign}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`;
}

export function formatMoneyMinor(minor: number, code: string): string {
  return formatMoney(minor / 100, code);
}
