import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Package, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ProcessExecution, Alert } from '../types';
import { handleApiError, logError } from '../utils/errorUtils';

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { activeSession, startSession, hasActiveSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [recentProcesses, setRecentProcesses] = useState<ProcessExecution[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      setDataLoading(true);
      setConnectionError(false);

      try {
        if (isAdmin) {
          // Admin dashboard data
          const [processesRes, alertsRes] = await Promise.all([
            api.get('/api/processes/recent'),
            api.get('/api/alerts/active'),
          ]);
          
          setRecentProcesses(processesRes.data);
          setAlerts(alertsRes.data);
        } else {
          // Operator dashboard data
          if (hasActiveSession) {
            const processesRes = await api.get(`/api/processes/user/${user.id}/active`);
            setRecentProcesses(processesRes.data);
          }
        }
      } catch (error: any) {
        logError(error, 'fetchDashboardData');
        const errorInfo = handleApiError(error);
        
        if (errorInfo.isNetworkError) {
          setConnectionError(true);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdmin, hasActiveSession]);

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      await startSession();
    } catch (error: any) {
      logError(error, 'startSession');
      const errorInfo = handleApiError(error);
      
      if (errorInfo.isNetworkError) {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Mostrar error de conexión si existe
  if (connectionError) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <WifiOff size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error de conexión
            </h3>
            <p className="text-gray-600 mb-4">
              No se puede conectar con el servidor. Verifica que:
            </p>
            <ul className="text-left text-sm text-gray-600 mb-6 max-w-md mx-auto">
              <li>• El servidor backend esté corriendo en el puerto 3001</li>
              <li>• Tu conexión a internet esté funcionando</li>
              <li>• No haya problemas con el firewall</li>
            </ul>
            <Button onClick={handleRetry} leftIcon={<Wifi size={18} />}>
              Reintentar conexión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.first_name || 'Usuario'}
          </h1>
          <p className="mt-1 text-gray-600">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        
        {!hasActiveSession && !isAdmin && (
          <Button
            onClick={handleStartSession}
            leftIcon={<Play size={18} />}
            isLoading={loading}
            className="mt-4 md:mt-0"
            disabled={connectionError}
          >
            Iniciar sesión de trabajo
          </Button>
        )}
        
        {hasActiveSession && !isAdmin && (
          <div className="mt-4 md:mt-0 bg-green-100 text-green-800 px-4 py-2 rounded-md flex items-center">
            <Clock size={18} className="mr-2" />
            <span>
              Sesión iniciada: {new Date(activeSession!.started_at).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {dataLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        </Card>
      )}
      
      {/* Quick Actions */}
      {hasActiveSession && !isAdmin && !dataLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/scanner')}
          >
            <Card>
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Package size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Escanear despacho</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escanea el código QR o de barras de un despacho
                </p>
              </div>
            </Card>
          </div>
          
          <div 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/processes')}
          >
            <Card>
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Clock size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Procesos activos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ver y continuar procesos en curso
                </p>
              </div>
            </Card>
          </div>
          
          <div 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/assistant')}
          >
            <Card>
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 w-6 h-6">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Asistente virtual</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Consulta dudas sobre procesos
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Admin Dashboard */}
      {isAdmin && !dataLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Procesos recientes" className="h-full">
            {recentProcesses.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentProcesses.slice(0, 5).map((process) => (
                  <div key={process.id} className="py-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{process.shipment_id}</h4>
                      <p className="text-sm text-gray-500">
                        Operario: {process.user_id}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      process.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : process.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {process.status === 'completed' 
                        ? 'Completado' 
                        : process.status === 'error'
                          ? 'Error'
                          : 'En progreso'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay procesos recientes</p>
            )}
          </Card>
          
          <Card title="Alertas activas" className="h-full">
            {alerts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="py-3">
                    <div className="flex items-start">
                      <AlertTriangle size={20} className={`mr-2 flex-shrink-0 ${
                        alert.type === 'error' 
                          ? 'text-red-500' 
                          : alert.type === 'warning'
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">Despacho: {alert.process_execution_id}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No hay alertas activas</p>
              </div>
            )}
            
            {alerts.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/alerts')}
                  fullWidth
                >
                  Ver todas las alertas
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* Operator Active Processes */}
      {hasActiveSession && !isAdmin && recentProcesses.length > 0 && !dataLoading && (
        <Card title="Tus procesos activos">
          <div className="divide-y divide-gray-200">
            {recentProcesses.map((process) => (
              <div key={process.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Despacho: {process.shipment_id}</h4>
                  <p className="text-sm text-gray-500">
                    Iniciado: {new Date(process.started_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/processes/${process.id}`)}
                >
                  Continuar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {hasActiveSession && !isAdmin && recentProcesses.length === 0 && !dataLoading && (
        <Card>
          <div className="text-center py-6">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tienes procesos activos</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Escanea el código de un despacho para comenzar un nuevo proceso.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/scanner')}
            >
              Escanear despacho
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;