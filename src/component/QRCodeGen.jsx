import { useMemo, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodeGen({ value, filename = 'pikchain-qr.png', label }) {
  const canvasRef = useRef(null);

  const safeValue = useMemo(() => {
    if (!value) return '';
    return String(value);
  }, [value]);

  const download = () => {
    const canvas = canvasRef.current?.querySelector?.('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (!safeValue) return null;

  return (
    <div className="w-full p-3 rounded-xl bg-white/10">
      {label && <div className="mb-2 text-xs text-slate-200">{label}</div>}
      <div className="flex items-center gap-3">
        <div ref={canvasRef} className="p-2 bg-white rounded">
          <QRCodeCanvas value={safeValue} size={120} level="H" includeMargin />
        </div>
        <div className="flex flex-col gap-2">
          <a
            className="text-xs text-teal-300 underline break-all"
            href={safeValue}
            target="_blank"
            rel="noreferrer"
          >
            {safeValue}
          </a>
          <button
            onClick={download}
            className="px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
