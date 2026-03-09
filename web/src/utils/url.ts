const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

export const normalizeWebsiteUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (SCHEME_PATTERN.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const isValidWebsiteUrl = (input: string): boolean => {
  const normalized = normalizeWebsiteUrl(input);
  if (!normalized) return true;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
