/**
 * Delivery timing utilities configured for Mummy Food Hub (IST: Asia/Kolkata)
 */

export type MealType = 'lunch' | 'dinner';

export interface DeliverySlotInfo {
  type: MealType;
  label: string;
  isAvailable: boolean;
  expectedDelivery: string;
  closeMessage?: string;
  orderValue: string; // e.g. "Lunch (12:30 PM – 2:00 PM)"
}

export interface TimingState {
  currentIstTime: string; // formatted e.g. "1:15 PM"
  istHours: number;
  istMinutes: number;
  lunch: DeliverySlotInfo;
  dinner: DeliverySlotInfo;
  availableSlots: DeliverySlotInfo[];
  defaultSlot: DeliverySlotInfo | null;
  isAnyOrderingOpen: boolean;
}

/**
 * Get current time in Indian Standard Time (IST, UTC+5:30)
 */
export function getIstDate(): Date {
  // Use Intl or timezone conversion to get exact current time in Asia/Kolkata
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Formats hours (0-23) and minutes (0-59) to 12-hour string (e.g. "12:45 PM", "1:30 PM")
 */
export function formatTime12H(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

/**
 * Adds minutes to an hour/minute pair and returns formatted 12H string
 */
export function addMinutes12H(hours: number, minutes: number, addMins: number): string {
  const totalMins = (hours * 60 + minutes + addMins) % (24 * 60);
  const endHours = Math.floor(totalMins / 60);
  const endMins = totalMins % 60;
  return formatTime12H(endHours, endMins);
}

/**
 * Compute real-time delivery timing and availability for Lunch and Dinner
 */
export function getDeliveryTimingState(customDate?: Date): TimingState {
  const ist = customDate || getIstDate();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const currentTimeMins = hours * 60 + minutes;

  // Cutoffs in minutes from midnight
  const LUNCH_DYNAMIC_START = 12 * 60 + 30; // 12:30 PM (750 mins)
  const LUNCH_CLOSE = 14 * 60;              // 2:00 PM (840 mins)

  const DINNER_DYNAMIC_START = 20 * 60;     // 8:00 PM (1200 mins)
  const DINNER_CLOSE = 21 * 60 + 30;        // 9:30 PM (1290 mins)

  // ── LUNCH CALCULATION ──
  let lunchAvailable = false;
  let lunchDelivery = '';
  let lunchCloseMsg: string | undefined;

  if (currentTimeMins <= LUNCH_CLOSE) {
    lunchAvailable = true;
    if (currentTimeMins < LUNCH_DYNAMIC_START) {
      lunchDelivery = '12:30 PM – 2:00 PM';
    } else {
      const nowStr = formatTime12H(hours, minutes);
      const plusOneHr = addMinutes12H(hours, minutes, 60);
      lunchDelivery = `${nowStr} – ${plusOneHr}`;
    }
  } else {
    lunchAvailable = false;
    lunchCloseMsg = 'Lunch ordering is closed. Lunch orders are accepted until 2:00 PM.';
  }

  const lunchSlot: DeliverySlotInfo = {
    type: 'lunch',
    label: 'Lunch',
    isAvailable: lunchAvailable,
    expectedDelivery: lunchDelivery || '12:30 PM – 2:00 PM',
    closeMessage: lunchCloseMsg,
    orderValue: `Lunch (${lunchDelivery || '12:30 PM – 2:00 PM'})`,
  };

  // ── DINNER CALCULATION ──
  let dinnerAvailable = false;
  let dinnerDelivery = '';
  let dinnerCloseMsg: string | undefined;

  if (currentTimeMins <= DINNER_CLOSE) {
    dinnerAvailable = true;
    if (currentTimeMins < DINNER_DYNAMIC_START) {
      dinnerDelivery = '8:00 PM – 9:30 PM';
    } else {
      const nowStr = formatTime12H(hours, minutes);
      const plusOneHr = addMinutes12H(hours, minutes, 60);
      dinnerDelivery = `${nowStr} – ${plusOneHr}`;
    }
  } else {
    dinnerAvailable = false;
    dinnerCloseMsg = 'Dinner ordering is closed. Dinner orders are accepted until 9:30 PM.';
  }

  const dinnerSlot: DeliverySlotInfo = {
    type: 'dinner',
    label: 'Dinner',
    isAvailable: dinnerAvailable,
    expectedDelivery: dinnerDelivery || '8:00 PM – 9:30 PM',
    closeMessage: dinnerCloseMsg,
    orderValue: `Dinner (${dinnerDelivery || '8:00 PM – 9:30 PM'})`,
  };

  const availableSlots: DeliverySlotInfo[] = [];
  if (lunchSlot.isAvailable) availableSlots.push(lunchSlot);
  if (dinnerSlot.isAvailable) availableSlots.push(dinnerSlot);

  // Determine default slot: if lunch is open, default to lunch; otherwise dinner if open; otherwise null
  let defaultSlot: DeliverySlotInfo | null = null;
  if (lunchSlot.isAvailable) {
    defaultSlot = lunchSlot;
  } else if (dinnerSlot.isAvailable) {
    defaultSlot = dinnerSlot;
  }

  return {
    currentIstTime: formatTime12H(hours, minutes),
    istHours: hours,
    istMinutes: minutes,
    lunch: lunchSlot,
    dinner: dinnerSlot,
    availableSlots,
    defaultSlot,
    isAnyOrderingOpen: availableSlots.length > 0,
  };
}

/**
 * Validates whether a requested delivery time / meal type is allowed right now
 */
export function validateOrderDeliveryTime(selectedDeliveryTime: string): { valid: boolean; reason?: string } {
  const state = getDeliveryTimingState();
  const lower = (selectedDeliveryTime || '').toLowerCase();

  const isLunch = lower.includes('lunch');
  const isDinner = lower.includes('dinner');

  if (isLunch) {
    if (!state.lunch.isAvailable) {
      return { valid: false, reason: state.lunch.closeMessage || 'Lunch ordering is closed for today.' };
    }
    return { valid: true };
  }

  if (isDinner) {
    if (!state.dinner.isAvailable) {
      return { valid: false, reason: state.dinner.closeMessage || 'Dinner ordering is closed for today.' };
    }
    return { valid: true };
  }

  // If general or morning/custom, check if any ordering is open
  if (!state.isAnyOrderingOpen) {
    return { valid: false, reason: 'Ordering is closed for today. Lunch orders accepted until 2:00 PM, Dinner until 9:30 PM.' };
  }

  return { valid: true };
}
