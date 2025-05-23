import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Check } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import QRScanner from '../components/scanner/QRScanner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { Shipment } from '../types';

const ScannerPage: React.FC = () => {
  const { hasActiveSession } = useSession();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScanSuccess = async (trackingCode: string) => {
    try {
      setError(null);
      setLoading(true);
      setScanning(false);
      
      // Call API to get shipment details
      const response = await api.get<Shipment>(`/api/shipments/${trackingCode}`);
      setShipment(response.data);
    } catch (err) {
      console.error('Error fetching shipment:', err);
      setError('No se pudo encontrar información para este despacho. Verifica el código e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = async () => {
    if (!shipment) return;
    
    try {
      setLoading(true);
      // Start a new process for this shipment
      const response = await api.post('/api/processes/start', {
        shipment_id: shipment.id,
      });
      
      // Navigate to the process page
      navigate(`/processes/${response.data.id}`);
    } catch (err) {
      console.error('Error starting process:', err);
      setError('No se pudo iniciar el proceso. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setShipment(null);
    setScanning(true);
    setError(null);
  };

  if (!hasActiveSession) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sesión no iniciada</h2>
        <p className="text-gray-600 mb-6">
          Debes iniciar una sesión de trabajo para escanear despachos.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Escanear despacho</h1>
      
      {scanning ? (
        <Card>
          <QRScanner onScanSuccess={handleScanSuccess} />
          <p className="text-sm text-gray-500 text-center mt-4">
            Apunta la cámara al código QR o código de barras del despacho
          </p>
        </Card>
      ) : (
        <Card>
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Cargando información del despacho...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                {error}
              </div>
              <Button onClick={resetScanner}>
                Escanear nuevamente
              </Button>
            </div>
          ) : shipment && (
            <div>
              <div className="flex items-center justify-center py-4 mb-4 bg-green-50 rounded-md">
                <Check size={24} className="text-green-500 mr-2" />
                <span className="text-green-800 font-medium">Despacho encontrado</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Código de seguimiento:</span>
                  <span className="text-gray-700">{shipment.tracking_code}</span>
                </div>
                
                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Cliente:</span>
                  <span className="text-gray-700">{shipment.client_name}</span>
                </div>
                
                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Tipo:</span>
                  <span className={shipment.type === 'import' ? 'text-blue-600' : 'text-green-600'}>
                    {shipment.type === 'import' ? 'Importación' : 'Exportación'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium">Destino:</span>
                  <span className="text-gray-700">{shipment.destination}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Fecha de llegada:</span>
                  <span className="text-gray-700">
                    {new Date(shipment.arrival_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <Button
                  fullWidth
                  leftIcon={<Package size={18} />}
                  onClick={handleStartProcess}
                  isLoading={loading}
                >
                  Iniciar proceso para este despacho
                </Button>
                
                <Button
                  fullWidth
                  variant="outline"
                  onClick={resetScanner}
                >
                  Escanear otro despacho
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ScannerPage;