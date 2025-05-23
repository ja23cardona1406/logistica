import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import { Alert } from '../types';
import api from '../lib/api';
import AlertCard from '../components/admin/AlertCard';
import LoadingScreen from '../components/ui/LoadingScreen';
import Card from '../components/ui/Card';

const AdminAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get<Alert[]>('/api/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.put(`/api/alerts/${alertId}/resolve`);
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolved_at: new Date().toISOString() } 
          : alert
      ));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  if (loading) {
    return <LoadingScreen message="Cargando alertas..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AlertTriangle size={28} className="text-red-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Alertas</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'resolved')}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="resolved">Resueltas</option>
          </select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No hay alertas para mostrar.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={handleResolveAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAlertsPage;