import React from 'react';
import { type ConnectionStatus as ConnectionStatusType } from '../../types';
interface ConnectionStatusProps {
  status: ConnectionStatusType;
}
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'error': return 'Erreur';
      case 'disconnected': return 'Déconnecté';
      default: return 'Inconnu';
    }
  };
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-700';
      case 'connecting': return 'text-blue-700';
      case 'error': return 'text-red-700';
      case 'disconnected': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  };
  const getDotColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-400 animate-pulse';
      case 'connecting': return 'bg-blue-400 animate-pulse';
      case 'error': return 'bg-red-400';
      case 'disconnected': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm border border-white/20">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getDotColor()}`}></div>
        <span className={getStatusColor()}>
          Centrifugo: {getStatusText()}
        </span>
      </div>
    </div>
  );
};
export default ConnectionStatus;
