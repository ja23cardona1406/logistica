import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanBarcode } from 'lucide-react';
import Button from '../ui/Button';

interface QRScannerProps {
  onScanSuccess: (trackingCode: string) => void;
  onScanError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanSuccess, 
  onScanError 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerId = 'qr-scanner';

  const startScanner = () => {
    setIsScanning(true);
    
    // Initialize the scanner
    scannerRef.current = new Html5QrcodeScanner(
      scannerContainerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current.render(
      // Success callback
      (decodedText) => {
        stopScanner();
        onScanSuccess(decodedText);
      },
      // Error callback
      (error) => {
        if (onScanError) {
          onScanError(error);
        }
        console.error('QR scan error:', error);
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    // Clean up on component unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="w-full">
      {!isScanning ? (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <ScanBarcode size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Escanear código QR o código de barras
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Haz clic en el botón para activar la cámara y escanear el código del despacho.
          </p>
          <Button
            onClick={startScanner}
            leftIcon={<ScanBarcode size={18} />}
            variant="primary"
          >
            Iniciar escáner
          </Button>
        </div>
      ) : (
        <div className="w-full">
          <div id={scannerContainerId} className="w-full"></div>
          <div className="mt-4 text-center">
            <Button onClick={stopScanner} variant="outline">
              Cancelar escaneo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;