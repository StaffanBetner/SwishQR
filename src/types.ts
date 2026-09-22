export interface SavedRecipient {
  id: string;
  name: string;
  number: string;
  category?: 'privat' | 'foretag' | 'forening' | 'loppis' | 'annat';
  defaultAmount?: string;
  defaultMessage?: string;
  createdAt: number;
}

export interface SwishFormData {
  recipientName: string;
  payee: string; // Phone or 123-number
  amount: string;
  message: string;
  lockAmount: boolean;
  lockMessage: boolean;
}

export interface SwishPayloadResult {
  payload: string; // E.g. "C0701234567;100,00;Fika;4"
  appUri: string;  // E.g. "swish://payment?data=%7B...%7D" or data string
  isValid: boolean;
  validationError?: string;
  lockMask: number;
}
