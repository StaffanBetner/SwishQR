import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Smartphone, Info, Share2, Maximize2, X } from 'lucide-react';
import { SwishPayloadResult, SwishFormData } from '../types';
import { formatSwishNumber } from '../utils/swish';

interface QRCodeDisplayProps {
  payloadResult: SwishPayloadResult;
  formData: SwishFormData;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ payloadResult, formData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR Code with Swish Center Logo
  useEffect(() => {
    if (!payloadResult.isValid || !payloadResult.payload || !canvasRef.current) {
      setQrDataUrl(null);
      return;
    }

    const canvas = canvasRef.current;
    const size = 800; // High resolution for razor-sharp rendering on Retina and large views
    canvas.width = size;
    canvas.height = size;

    QRCode.toCanvas(
      canvas,
      payloadResult.payload,
      {
        errorCorrectionLevel: 'Q', // Allows 25% logo coverage
        margin: 1, // Tight quiet zone so the QR modules fill the maximum available width
        width: size,
        color: {
          dark: '#0f172a', // deep slate
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          console.error('QR code generation failed', error);
          return;
        }

        // Reset inline width/height injected by qrcode library so it fluidly scales to 100% of container width
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';

        // Draw Swish Center Emblem on Canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const center = size / 2;
        const logoSize = size * 0.22; // ~22% diameter
        const radius = logoSize / 2;

        // White circular background behind logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, radius + 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Very subtle ring
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Draw Swish swirl icon
        const swishSvgString = `
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="swishLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#EB1C24" />
                <stop offset="100%" stop-color="#F7931E" />
              </linearGradient>
              <linearGradient id="swishRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00A9E0" />
                <stop offset="100%" stop-color="#003A70" />
              </linearGradient>
            </defs>
            <g transform="translate(10, 10) scale(0.8)">
              <path d="M 49 14 C 28 14 12 30 12 51 C 12 65 20 77 32 82 C 34 83 36 82 36 80 C 36 78 34 77 33 76 C 24 71 18 62 18 51 C 18 34 32 20 49 20 C 60 20 70 26 75 35 C 76 37 78 37 79 36 C 80 35 80 33 79 32 C 72 21 61 14 49 14 Z" fill="url(#swishLeft)" />
              <path d="M 51 86 C 72 86 88 70 88 49 C 88 35 80 23 68 18 C 66 17 64 18 64 20 C 64 22 66 23 67 24 C 76 29 82 38 82 49 C 82 66 68 80 51 80 C 40 80 30 74 25 65 C 24 63 22 63 21 64 C 20 65 20 67 21 68 C 28 79 39 86 51 86 Z" fill="url(#swishRight)" />
              <circle cx="34" cy="38" r="5" fill="#EB1C24" />
              <circle cx="66" cy="62" r="5" fill="#00A9E0" />
            </g>
          </svg>
        `;

        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(swishSvgString);
        img.onload = () => {
          ctx.drawImage(img, center - radius, center - radius, logoSize, logoSize);
          ctx.restore();
          setQrDataUrl(canvas.toDataURL('image/png'));
        };
      }
    );
  }, [payloadResult.payload, payloadResult.isValid]);

  const handleDownload = () => {
    if (!canvasRef.current || !payloadResult.isValid) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const safeName = (formData.recipientName || formData.payee || 'swish-qr')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-');
    link.download = `swish-qr-${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current || !payloadResult.isValid) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied('image');
          setTimeout(() => setCopied(null), 2500);
        } else {
          // Fallback to copying payload string
          await navigator.clipboard.writeText(payloadResult.payload);
          setCopied('text');
          setTimeout(() => setCopied(null), 2500);
        }
      });
    } catch (err) {
      console.error('Could not copy image', err);
      // Fallback
      await navigator.clipboard.writeText(payloadResult.payload);
      setCopied('text');
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleCopyPayload = async () => {
    if (!payloadResult.payload) return;
    await navigator.clipboard.writeText(payloadResult.payload);
    setCopied('payload');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div id="qr-display-container" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-6 flex flex-col items-center w-full">
      {/* Title & Status */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3 sm:mb-4 gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>Färdig QR-kod</span>
            {payloadResult.isValid && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Aktiv
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Skannas direkt med Swish-appen i mobilen
          </p>
        </div>

        {payloadResult.isValid && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="expand-qr-btn"
              type="button"
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
              title="Förstora QR-kod (fullskärm)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Förstora</span>
            </button>

            <button
              id="open-swish-mobile-btn"
              type="button"
              onClick={() => {
                window.location.href = payloadResult.appUri;
              }}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
              title="Öppna direkt i Swish på mobilen"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Öppna</span>
            </button>
          </div>
        )}
      </div>

      {/* QR Canvas Card - Fills 100% of available card width */}
      <div
        id="qr-canvas-wrapper"
        onClick={() => payloadResult.isValid && setIsExpanded(true)}
        className={`relative w-full aspect-square flex items-center justify-center bg-white rounded-2xl border border-slate-200 p-1 sm:p-2 shadow-xs my-1 mx-auto overflow-hidden transition-all ${
          payloadResult.isValid ? 'cursor-pointer hover:border-blue-400 group ring-2 ring-transparent hover:ring-blue-100' : ''
        }`}
        title={payloadResult.isValid ? 'Klicka för att förstora' : undefined}
      >
        {payloadResult.isValid ? (
          <>
            <canvas
              ref={canvasRef}
              id="swish-qr-canvas"
              className="w-full h-full max-w-full max-h-full object-contain rounded-xl bg-white block"
              style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
            />
            {/* Subtle tap/click hint */}
            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/70 hover:bg-slate-900/90 text-white rounded-lg px-2 py-1 opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-xs text-[11px] flex items-center gap-1 pointer-events-none">
              <Maximize2 className="w-3 h-3" />
              <span>Förstora</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <Smartphone className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Fyll i uppgifter</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Ange Swish- eller mobilnummer till vänster för att skapa din QR-kod.
            </p>
          </div>
        )}
      </div>

      {/* Summary Chips */}
      {payloadResult.isValid && (
        <div className="w-full mt-3 sm:mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Mottagare:</span>
            <span className="font-semibold text-slate-800">
              {formData.recipientName ? `${formData.recipientName} • ` : ''}
              {formatSwishNumber(formData.payee)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Belopp:</span>
            <span className="font-semibold text-slate-800">
              {formData.amount ? `${formData.amount} kr` : 'Valfritt belopp'}
              {formData.amount && (
                <span className="ml-1 text-[10px] text-slate-400">
                  ({formData.lockAmount ? 'låst' : 'kan ändras'})
                </span>
              )}
            </span>
          </div>

          {formData.message && (
            <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-200/50">
              <span className="text-slate-400 font-medium shrink-0">Meddelande:</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                "{formData.message}"
              </span>
            </div>
          )}
        </div>
      )}

      {/* Primary Action Button: Ladda ner bild */}
      <div className="w-full mt-3 sm:mt-4">
        <button
          id="download-qr-btn"
          type="button"
          onClick={handleDownload}
          disabled={!payloadResult.isValid}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Ladda ner bild (PNG)</span>
        </button>
      </div>

      {/* Secondary Actions: Kopiera & Testa i Swish */}
      <div className="w-full grid grid-cols-2 gap-2 mt-2">
        <button
          id="copy-image-btn"
          type="button"
          onClick={handleCopyImage}
          disabled={!payloadResult.isValid}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {copied === 'image' || copied === 'text' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Kopierad!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Kopiera bild</span>
            </>
          )}
        </button>

        <button
          id="test-swish-app-btn"
          type="button"
          onClick={() => {
            if (payloadResult.isValid) {
              window.open(payloadResult.appUri, '_blank');
            }
          }}
          disabled={!payloadResult.isValid}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Öppna Swish med ifyllda uppgifter på denna enhet"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Testa i Swish</span>
        </button>
      </div>

      {/* Technical Payload Accordion */}
      {payloadResult.isValid && (
        <div className="w-full mt-3 sm:mt-4 pt-3 border-t border-slate-100">
          <button
            id="toggle-technical-details"
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5" />
              Visa Swish-kod (payload)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {showTechnical ? 'Dölj ▲' : 'Visa ▼'}
            </span>
          </button>

          {showTechnical && (
            <div className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono break-all space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                <span>Standard Swish QR Payload:</span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
                >
                  {copied === 'payload' ? 'Kopierad!' : 'Kopiera sträng'}
                </button>
              </div>
              <div className="text-emerald-400 select-all font-mono text-[11px]">
                {payloadResult.payload}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                Struktur: <code className="text-slate-200">C&lt;mottagare&gt;;&lt;belopp&gt;;&lt;meddelande&gt;;&lt;låsmask: {payloadResult.lockMask}&gt;</code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen / Enlarged QR Modal */}
      {isExpanded && qrDataUrl && (
        <div
          id="qr-fullscreen-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="bg-white rounded-3xl p-3.5 sm:p-6 w-full max-w-[96vw] sm:max-w-md shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {formData.recipientName || 'Swish-betalning'}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatSwishNumber(formData.payee)}
                  {formData.amount && ` • ${formData.amount} kr`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Stäng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large QR Code - Maximizes screen space */}
            <div className="w-full aspect-square p-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-center">
              <img
                src={qrDataUrl}
                alt="Förstorad Swish QR-kod"
                className="w-full h-full object-contain"
              />
            </div>

            {formData.message && (
              <p className="mt-2.5 text-xs text-slate-600 font-medium text-center bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100 w-full">
                Meddelande: "{formData.message}"
              </p>
            )}

            {/* Actions */}
            <div className="w-full mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Spara bild</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
