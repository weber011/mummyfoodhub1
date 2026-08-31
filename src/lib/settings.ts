import { redisGet, redisSet } from './redis';
import type { AdminSettings } from './types';
import { DEFAULT_ADMIN_SETTINGS } from './types';

const SETTINGS_KEY = 'admin:settings';

export async function getAdminSettings(): Promise<AdminSettings> {
  const stored = await redisGet<AdminSettings>(SETTINGS_KEY);
  if (!stored) return { ...DEFAULT_ADMIN_SETTINGS };
  // Merge with defaults to ensure new fields have fallbacks
  return { ...DEFAULT_ADMIN_SETTINGS, ...stored };
}

export async function updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
  const current = await getAdminSettings();
  const updated: AdminSettings = { ...current, ...updates };
  await redisSet(SETTINGS_KEY, updated);
  return updated;
}

/**
 * Parse "HH:MM" string into { hours, minutes } in 24h format
 */
export function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/**
 * Get current IST time in minutes from midnight
 */
export function getIstMinutes(): number {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const ist = new Date(istString);
  return ist.getHours() * 60 + ist.getMinutes();
}

/**
 * Get current IST date as YYYY-MM-DD
 */
export function getIstDateString(): string {
  const now = new Date();
  const istString = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
  return istString.split(',')[0]; // strip any time portion
}

/**
 * Check if skip is still allowed for a given meal type.
 * Returns { allowed, minutesRemaining, cutoffTime }
 */
export async function isSkipAllowed(
  mealType: 'lunch' | 'dinner'
): Promise<{ allowed: boolean; minutesRemaining: number; cutoffTime: string }> {
  const settings = await getAdminSettings();
  const cutoffStr = mealType === 'lunch' ? settings.lunchSkipCutoff : settings.dinnerSkipCutoff;
  const { hours, minutes } = parseTime(cutoffStr);
  const cutoffMins = hours * 60 + minutes;
  const nowMins = getIstMinutes();
  const minutesRemaining = cutoffMins - nowMins;

  return {
    allowed: nowMins < cutoffMins,
    minutesRemaining: Math.max(0, minutesRemaining),
    cutoffTime: cutoffStr,
  };
}

/**
 * Format HH:MM to human-readable 12h string e.g. "9:00 AM"
 */
export function formatCutoffTime(hhmm: string): string {
  const { hours, minutes } = parseTime(hhmm);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}
