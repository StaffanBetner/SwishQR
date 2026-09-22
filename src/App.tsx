/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Lock, 
  Check, 
  X,
  Trash2
} from 'lucide-react';
import { SwishFormData, SavedRecipient } from './types';
import { 
  cleanSwishNumber, 
  formatSwishNumber, 
  validateSwishNumber, 
  generateSwishPayload 
} from './utils/swish';
import { 
  getSavedRecipients, 
  saveRecipient, 
  deleteRecipient, 
  getLastUsedRecipientId, 
  setLastUsedRecipientId 
} from './utils/storage';
import { SwishLogo } from './components/SwishBadge';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { SavedRecipientsModal } from './components/SavedRecipientsModal';

export default function App() {
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Form State: Starts completely clean without dummy examples
  const [formData, setFormData] = useState<SwishFormData>({
    recipientName: '',
    payee: '',
    amount: '',
    message: '',
    lockAmount: false,
    lockMessage: false,
  });

  // Load saved recipients from localStorage on mount (real saved data only)
  useEffect(() => {
    const list = getSavedRecipients();
    setRecipients(list);

    const lastUsedId = getLastUsedRecipientId();
    if (lastUsedId) {
      const rec = list.find((r) => r.id === lastUsedId);
      if (rec) {
        setFormData({
          recipientName: rec.name,
          payee: formatSwishNumber(rec.number),
          amount: '',
          message: '',
          lockAmount: false,
          lockMessage: false,
        });
      }
    }
  }, []);

  // Compute live Swish payload
  const payloadResult = useMemo(() => {
    return generateSwishPayload(formData);
  }, [formData]);

  // Check if current number is already in saved recipients
  const currentCleanNumber = cleanSwishNumber(formData.payee);
  const isAlreadySaved = useMemo(() => {
    if (!currentCleanNumber) return false;
    return recipients.some(
      (r) => cleanSwishNumber(r.number) === currentCleanNumber
    );
  }, [recipients, currentCleanNumber]);

  // Select a saved recipient
  const handleSelectRecipient = (rec: SavedRecipient) => {
    setFormData((prev) => ({
      ...prev,
      recipientName: rec.name,
      payee: formatSwishNumber(rec.number),
    }));
    setLastUsedRecipientId(rec.id);
  };

  // Save current recipient to localStorage
  const handleQuickSaveCurrent = () => {
    const validation = validateSwishNumber(formData.payee);
    if (!validation.isValid) return;

    const savedName = formData.recipientName.trim() || 
      (validation.type === 'company' ? 'Företag / Förening' : 'Mottagare');

    const saved = saveRecipient({
      name: savedName,
      number: cleanSwishNumber(formData.payee),
    });

    const updated = getSavedRecipients();
    setRecipients(updated);
    setLastUsedRecipientId(saved.id);
    if (!formData.recipientName) {
      setFormData((prev) => ({ ...prev, recipientName: savedName }));
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleDeleteRecipient = (id: string) => {
    const remaining = deleteRecipient(id);
    setRecipients(remaining);
  };

  const validation = validateSwishNumber(formData.payee);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SwishLogo size={34} />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Swish QR-generator
              </h1>
              <p className="text-xs text-slate-500">
                Skapa färdiga QR-koder för direktbetalning
              </p>
            </div>
          </div>

          {recipients.length > 0 && (
            <button
              id="manage-recipients-btn"
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span>Sparade mottagare ({recipients.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            {/* Quick selector of real saved recipients */}
            {recipients.length > 0 && (
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sparade mottagare i minnet
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Hantera
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {recipients.map((rec) => {
                    const isSelected = cleanSwishNumber(formData.payee) === cleanSwishNumber(rec.number);
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleSelectRecipient(rec)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                        }`}
                      >
                        <span>{rec.name}</span>
                        <span className={isSelected ? 'text-blue-200 text-[11px]' : 'text-slate-400 font-mono text-[11px]'}>
                          ({formatSwishNumber(rec.number)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mottagare */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="payee-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Swish-nummer eller mobilnummer *
                </label>
                {validation.isValid && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {validation.type === 'company' ? 'Företagsnummer' : 'Mobilnummer'}
                  </span>
                )}
              </div>

              <input
                id="payee-input"
                type="tel"
                value={formData.payee}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    payee: e.target.value,
                  }));
                }}
                placeholder="t.ex. 070-123 45 67 eller 123 456 78 90"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-base transition focus:outline-none focus:ring-2 ${
                  formData.payee && !validation.isValid
                    ? 'border-rose-300 focus:ring-rose-200 text-slate-900 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500 text-slate-900 bg-white'
                }`}
              />

              {formData.payee && !validation.isValid && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {validation.error}
                </p>
              )}

              {/* Mottagarnamn & Spara i browserminnet */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  id="recipient-name-input"
                  type="text"
                  placeholder="Mottagarnamn (valfritt, t.ex. ditt namn eller företag)"
                  value={formData.recipientName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientName: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />

                <button
                  id="save-to-memory-btn"
                  type="button"
                  onClick={handleQuickSaveCurrent}
                  disabled={!validation.isValid}
                  className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    saveSuccessMsg
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isAlreadySaved
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title="Spara mottagaren i webbläsarens minne (localStorage)"
                >
                  {saveSuccessMsg ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sparad!</span>
                    </>
                  ) : isAlreadySaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sparad i minnet</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                      <span>Spara i browserminnet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Belopp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="amount-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Belopp (valfritt)
                </label>
                <span className="text-[11px] text-slate-400">
                  Lämna tomt för valfritt belopp
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="amount-input"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-base font-semibold text-slate-900 bg-white"
                />
                <div className="absolute right-3.5 font-bold text-slate-400 text-sm pointer-events-none">
                  SEK
                </div>
              </div>

              {/* Lås belopp kryssruta */}
              {formData.amount && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    id="lock-amount-checkbox"
                    type="checkbox"
                    checked={formData.lockAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lockAmount: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="lock-amount-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                    Lås belopp (betalaren kan inte ändra beloppet i Swish)
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Meddelande */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="message-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meddelande (valfritt)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formData.message.length}/50 tecken
                </span>
              </div>

              <input
                id="message-input"
                type="text"
                maxLength={50}
                placeholder="Meddelande eller referens"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-slate-900 bg-white"
              />

              {/* Lås meddelande kryssruta */}
              {formData.message && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    id="lock-message-checkbox"
                    type="checkbox"
                    checked={formData.lockMessage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lockMessage: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="lock-message-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                    Lås meddelande (betalaren kan inte ändra meddelandet)
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: QR Code Preview */}
          <div className="lg:col-span-5 w-full max-w-full overflow-hidden lg:sticky lg:top-6">
            <QRCodeDisplay
              payloadResult={payloadResult}
              formData={formData}
            />
          </div>
        </div>
      </main>

      {/* Saved Recipients Modal */}
      <SavedRecipientsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipients={recipients}
        onSelect={handleSelectRecipient}
        onDelete={handleDeleteRecipient}
      />
    </div>
  );
}
