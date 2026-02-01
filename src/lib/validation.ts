const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());

export const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
};
