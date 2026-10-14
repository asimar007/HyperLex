export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

const relative = new Intl.RelativeTimeFormat("en");

export function timeAgo(epochMs: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - epochMs) / 1000));
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return relative.format(-n, name);
  }
  return "just now";
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
