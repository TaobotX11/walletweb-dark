import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiveProps {
  address: string;
}

export function Receive({ address }: ReceiveProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Receive NUX</h2>

      <div className="card flex flex-col items-center py-8 space-y-6">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl">
          <QRCodeSVG
            value={address}
            size={200}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
          />
        </div>

        {/* Address */}
        <div className="text-center w-full">
          <p className="text-dark-400 text-sm mb-2">Your Address</p>
          <p className="font-mono text-sm break-all bg-dark-800 rounded-xl px-4 py-3">
            {address}
          </p>
        </div>

        {/* Copy Button */}
        <button onClick={handleCopy} className="btn-primary">
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
      </div>

      <p className="text-dark-500 text-sm text-center">
        Share this address to receive Nusacoin. Only send NUX to this address.
      </p>
    </div>
  );
}
