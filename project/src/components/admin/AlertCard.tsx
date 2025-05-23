import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface AlertCardProps {
  alert: Alert;
  onResolve: (alertId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onResolve }) => {
  const typeIcons = {
    error: <AlertTriangle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const typeStyles = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  const formattedDate = new Date(alert.created_at).toLocaleString();

  return (
    <Card className={`mb-4 border ${typeStyles[alert.type]}`}>
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          {typeIcons[alert.type]}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="text-lg font-medium">
              Alerta: {alert.process_execution_id}
            </h4>
            <span className="text-sm text-gray-500">{formattedDate}</span>
          </div>
          
          <p className="mt-2">{alert.message}</p>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Operario: {alert.user_id}
            </div>
            
            {!alert.resolved && (
              <Button
                onClick={() => onResolve(alert.id)}
                variant="outline"
                size="sm"
                leftIcon={<CheckCircle size={16} />}
              >
                Marcar como resuelto
              </Button>
            )}
            
            {alert.resolved && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle size={16} className="mr-1" />
                <span>Resuelto el {new Date(alert.resolved_at!).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlertCard;