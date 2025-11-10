import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { ExemplaryProcess } from '../../types';
import Card from '../ui/Card';

interface ExemplaryProcessCardProps {
  exemplaryProcess: ExemplaryProcess;
  onClick?: () => void;
}

const ExemplaryProcessCard: React.FC<ExemplaryProcessCardProps> = ({
  exemplaryProcess,
  onClick,
}) => {
  return (
    <Card
      className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-blue-900 rounded-full p-1">
          <Award size={20} />
        </div>

        <img
          src={exemplaryProcess.image_url}
          alt={exemplaryProcess.title}
          className="w-full h-48 object-cover rounded-md mb-3"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {exemplaryProcess.title}
      </h3>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {exemplaryProcess.description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {new Date(exemplaryProcess.created_at).toLocaleDateString('es-CO')}
        </span>

        {exemplaryProcess.video_url && (
          <span className="text-blue-600 flex items-center">
            <ExternalLink size={14} className="mr-1" />
            Ver video
          </span>
        )}
      </div>
    </Card>
  );
};

export default ExemplaryProcessCard;
