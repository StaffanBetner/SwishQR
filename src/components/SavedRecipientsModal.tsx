import React from 'react';
import { X, Trash2, BookmarkCheck } from 'lucide-react';
import { SavedRecipient } from '../types';
import { formatSwishNumber } from '../utils/swish';

interface SavedRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: SavedRecipient[];
  onSelect: (recipient: SavedRecipient) => void;
  onDelete: (id: string) => void;
}

export const SavedRecipientsModal: React.FC<SavedRecipientsModalProps> = ({
  isOpen,
  onClose,
  recipients,
  onSelect,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        id="saved-recipients-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Sparade mottagare i minnet
            </h3>
          </div>
          <button
            id="close-recipients-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Inga sparade mottagare i minnet än. Fyll i ett Swish-nummer och klicka på "Spara i minnet" för att spara.
            </div>
          ) : (
            recipients.map((rec) => (
              <div
                key={rec.id}
                id={`recipient-item-${rec.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition bg-white"
              >
                <div
                  className="flex-1 cursor-pointer min-w-0 pr-3"
                  onClick={() => {
                    onSelect(rec);
                    onClose();
                  }}
                >
                  <div className="font-semibold text-slate-900 text-sm truncate">
                    {rec.name}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {formatSwishNumber(rec.number)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(rec);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Välj
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Ta bort från minnet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Sparat lokalt i din webbläsare</span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
