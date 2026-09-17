export const PUBLISHER_OWNER_EMAIL = '1feathersofficial@gmail.com';

export function normalizeEmail(email: string | undefined | null) {
  return email?.trim().toLowerCase() ?? '';
}