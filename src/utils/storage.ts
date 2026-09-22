import { SavedRecipient } from '../types';

const STORAGE_KEY = 'swish_saved_recipients_v1';
const LAST_USED_KEY = 'swish_last_used_recipient_v1';

export function getSavedRecipients(): SavedRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any legacy demo/sample items
      const cleanList = parsed.filter(
        (item) => item && typeof item.id === 'string' && !item.id.startsWith('sample-')
      );
      if (cleanList.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    }
    return [];
  } catch (err) {
    console.error('Error reading saved recipients from localStorage', err);
    return [];
  }
}

export function saveRecipient(recipient: Omit<SavedRecipient, 'id' | 'createdAt'> & { id?: string }): SavedRecipient {
  const current = getSavedRecipients();
  const now = Date.now();

  if (recipient.id) {
    // Update existing
    const updated = current.map((item) =>
      item.id === recipient.id
        ? { ...item, ...recipient }
        : item
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recipient', e);
    }
    const existing = updated.find((i) => i.id === recipient.id);
    return existing || { ...recipient, id: recipient.id, createdAt: now };
  } else {
    // Check if number already exists to avoid duplicates
    const cleanNum = recipient.number.replace(/\D/g, '');
    const existingIndex = current.findIndex((item) => item.number.replace(/\D/g, '') === cleanNum);

    const newId = 'rec_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const newEntry: SavedRecipient = {
      ...recipient,
      id: newId,
      createdAt: now,
    };

    let updatedList: SavedRecipient[];
    if (existingIndex >= 0) {
      updatedList = current.map((item, idx) =>
        idx === existingIndex ? { ...item, ...newEntry, id: item.id } : item
      );
    } else {
      updatedList = [newEntry, ...current];
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save recipient', e);
    }
    return newEntry;
  }
}

export function deleteRecipient(id: string): SavedRecipient[] {
  const current = getSavedRecipients();
  const filtered = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete recipient', e);
  }
  return filtered;
}

export function getLastUsedRecipientId(): string | null {
  try {
    const id = localStorage.getItem(LAST_USED_KEY);
    if (id && id.startsWith('sample-')) {
      localStorage.removeItem(LAST_USED_KEY);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

export function setLastUsedRecipientId(id: string): void {
  try {
    localStorage.setItem(LAST_USED_KEY, id);
  } catch {
    // ignore
  }
}
