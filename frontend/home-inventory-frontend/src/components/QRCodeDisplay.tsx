import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 128,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <QRCodeCanvas
        value={value}
        size={size}
        level="M"
        includeMargin={true}
      />
      <p className="text-sm text-gray-600 font-mono">{value}</p>
    </div>
  );
};

export default QRCodeDisplay;