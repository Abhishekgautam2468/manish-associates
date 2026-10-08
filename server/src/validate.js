export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (what) => new HttpError(404, `${what} not found. It may have been deleted.`);

export const MODES = ['cash', 'upi', 'bank', 'cheque', 'card', 'other'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function text(value, { max = 500 } = {}) {
  return String(value ?? '').trim().slice(0, max);
}

export function date(value, field = 'Date') {
  const v = String(value ?? '');
  if (!DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw badRequest(`${field} must be a valid date.`);
  return v;
}

export function optionalDate(value, field) {
  return value ? date(value, field) : null;
}

// Accepts rupees (number or string like "1,250.50") and returns paise.
export function amount(value, field = 'Amount') {
  const rupees = Number(String(value ?? '').replace(/[,₹\s]/g, ''));
  if (!Number.isFinite(rupees) || rupees <= 0) throw badRequest(`${field} must be more than ₹0.`);
  if (rupees > 1e11) throw badRequest(`${field} is too large.`);
  return Math.round(rupees * 100);
}

export function phone(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/[\s()-]/g, '');
  if (!/^\+?\d{7,15}$/.test(digits)) {
    throw badRequest('Phone number should be 7 to 15 digits, for example 98765 43210.');
  }
  // Store Indian 10-digit numbers with the country code so duplicates are caught.
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}

// MongoDB ObjectId as a 24-character hex string.
export function id(value, field = 'id') {
  const v = String(value ?? '');
  if (!/^[a-f\d]{24}$/i.test(v)) throw badRequest(`Invalid ${field}.`);
  return v;
}

// For case-insensitive "contains" searches built from user input.
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function shiftDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function oneOf(value, options, field) {
  if (!options.includes(value)) throw badRequest(`${field} must be one of: ${options.join(', ')}.`);
  return value;
}

export function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
