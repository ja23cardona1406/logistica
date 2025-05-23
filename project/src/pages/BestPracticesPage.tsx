import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Search } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ExemplaryProcessCard from '../components/processes/ExemplaryProcessCard';
import { ExemplaryProcess } from '../types';
import LoadingScreen from '../components/ui/LoadingScreen';

const BestPracticesPage: React.FC = () => {
  const [exemplaryProcesses, setExemplaryProcesses] = useState<ExemplaryProcess[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<ExemplaryProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ExemplaryProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExemplaryProcesses = async () => {
      try {
        const response = await api.get<ExemplaryProcess[]>('/api/exemplary-processes');
        setExemplaryProcesses(response.data);
        setFilteredProcesses(response.data);
      } catch (error) {
        console.error('Error fetching exemplary processes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExemplaryProcesses();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProcesses(exemplaryProcesses);
    } else {
      const filtered = exemplaryProcesses.filter(
        process => 
          process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          process.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProcesses(filtered);
    }
  }, [searchTerm, exemplaryProcesses]);

  const handleProcessClick = (process: ExemplaryProcess) => {
    setSelectedProcess(process);
  };

  const closeModal = () => {
    setSelectedProcess(null);
  };

  if (loading) {
    return <LoadingScreen message="Cargando procesos ejemplares..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award size={28} className="text-yellow-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Procesos Bien Hechos</h1>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar procesos ejemplares..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {filteredProcesses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron procesos ejemplares.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map((process) => (
            <ExemplaryProcessCard
              key={process.id}
              exemplaryProcess={process}
              onClick={() => handleProcessClick(process)}
            />
          ))}
        </div>
      )}

      {/* Process Detail Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProcess.title}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <img
                src={selectedProcess.image_url}
                alt={selectedProcess.title}
                className="w-full h-auto rounded-lg mb-4"
              />

              <p className="text-gray-700 mb-6">{selectedProcess.description}</p>

              {selectedProcess.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Video demostrativo</h3>
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg">
                    <iframe
                      src={selectedProcess.video_url}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="text-right">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestPracticesPage;