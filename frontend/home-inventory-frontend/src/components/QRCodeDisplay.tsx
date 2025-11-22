import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 100,
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
    </div>
  );
};

export default QRCodeDisplay;