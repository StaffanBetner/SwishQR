import { SwishFormData, SwishPayloadResult } from '../types';

/**
 * Normalizes input phone or Swish company number to clean 10-digit format.
 * Examples:
 * "+46 70-123 45 67" -> "0701234567"
 * "46701234567" -> "0701234567"
 * "123 456 78 90" -> "1234567890"
 */
export function cleanSwishNumber(input: string): string {
  let cleaned = input.replace(/\s+/g, '').replace(/[-().]/g, '');
  if (cleaned.startsWith('+46')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0046')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('46') && cleaned.length > 9 && (cleaned[2] === '7' || cleaned[2] === '1')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned.replace(/\D/g, '');
}

/**
 * Formats a 10-digit number for display:
 * 0701234567 -> 070-123 45 67
 * 1234567890 -> 123 456 78 90
 */
export function formatSwishNumber(input: string): string {
  const digits = cleanSwishNumber(input);
  if (!digits) return input;

  if (digits.startsWith('123') && digits.length <= 10) {
    // Company/association format: 123 XXX XX XX
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 8);
    const p4 = digits.slice(8, 10);
    return [p1, p2, p3, p4].filter(Boolean).join(' ');
  }

  if (digits.startsWith('07') && digits.length <= 10) {
    // Mobile format: 07X-XXX XX XX
    const prefix = digits.slice(0, 3);
    const rest = digits.slice(3);
    if (rest.length === 0) return prefix;
    const p1 = rest.slice(0, 3);
    const p2 = rest.slice(3, 5);
    const p3 = rest.slice(5, 7);
    const formattedRest = [p1, p2, p3].filter(Boolean).join(' ');
    return `${prefix}-${formattedRest}`;
  }

  return input;
}

/**
 * Validates whether the number is a valid Swedish Swish number.
 */
export function validateSwishNumber(input: string): { isValid: boolean; error?: string; type?: 'mobile' | 'company' } {
  const digits = cleanSwishNumber(input);
  if (!digits) {
    return { isValid: false, error: 'Ange ett Swish-nummer eller mobilnummer' };
  }

  if (digits.startsWith('123')) {
    if (digits.length !== 10) {
      return { isValid: false, error: 'Företagsnummer (123...) ska bestå av exakt 10 siffror' };
    }
    return { isValid: true, type: 'company' };
  }

  if (digits.startsWith('07')) {
    if (digits.length !== 10) {
      return { isValid: false, error: 'Mobilnummer ska bestå av exakt 10 siffror (t.ex. 070-123 45 67)' };
    }
    return { isValid: true, type: 'mobile' };
  }

  if (digits.length === 10) {
    return { isValid: true, type: 'mobile' };
  }

  return { isValid: false, error: 'Numret måste vara ett svenskt mobilnummer (07X) eller företagsnummer (123)' };
}

/**
 * Normalizes amount string into Swish payload format.
 * E.g. "100" -> "100"
 * "99.5" -> "99,50"
 */
export function formatAmountForPayload(amountStr: string): string {
  const trimmed = amountStr.trim().replace(/\s/g, '');
  if (!trimmed) return '';

  const normalized = trimmed.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) return '';

  // If integer: "100"
  if (Number.isInteger(num)) {
    return num.toString();
  }
  // If decimal: format with 2 decimals and comma
  return num.toFixed(2).replace('.', ',');
}

/**
 * Generates the official Swish QR payload string:
 * Format: C<payee>;<amount>;<message>;<lockMask>
 *
 * Lock mask bitmask:
 * bit 1 (1): payee editable (0 = locked)
 * bit 2 (2): amount editable (0 = locked, 2 = editable)
 * bit 4 (4): message editable (0 = locked, 4 = editable)
 */
export function generateSwishPayload(data: SwishFormData): SwishPayloadResult {
  const payeeClean = cleanSwishNumber(data.payee);
  const validation = validateSwishNumber(payeeClean);

  if (!validation.isValid) {
    return {
      payload: '',
      appUri: '',
      isValid: false,
      validationError: validation.error,
      lockMask: 6,
    };
  }

  const amountStr = formatAmountForPayload(data.amount);
  const rawMessage = (data.message || '').slice(0, 50).trim();
  // Swish spec specifies URL encoded message for the C-format:
  const encodedMessage = rawMessage ? encodeURIComponent(rawMessage) : '';

  // Lock Mask calculation
  // Payee is locked: 0
  // Amount: if locked -> 0, if editable -> 2
  // If no amount was provided at all, it MUST be editable (2) so the payer can enter it
  const amountEditable = !data.lockAmount || !amountStr;
  const amountMask = amountEditable ? 2 : 0;

  // Message: if locked -> 0, if editable -> 4
  const messageEditable = !data.lockMessage;
  const messageMask = messageEditable ? 4 : 0;

  const lockMask = amountMask + messageMask;

  const payload = `C${payeeClean};${amountStr};${encodedMessage};${lockMask}`;

  // Direct Swish mobile URL scheme for native app launch / testing
  const swishObj: Record<string, unknown> = {
    version: 1,
    payee: { value: payeeClean },
  };

  if (amountStr) {
    const numericAmount = parseFloat(amountStr.replace(',', '.'));
    if (!isNaN(numericAmount) && numericAmount > 0) {
      swishObj.amount = {
        value: numericAmount,
        editable: amountEditable,
      };
    }
  }

  if (rawMessage) {
    swishObj.message = {
      value: rawMessage,
      editable: messageEditable,
    };
  }

  const appUri = `swish://payment?data=${encodeURIComponent(JSON.stringify(swishObj))}`;

  return {
    payload,
    appUri,
    isValid: true,
    lockMask,
  };
}
