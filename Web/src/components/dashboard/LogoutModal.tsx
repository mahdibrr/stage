import React from 'react';
interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/30 hover:scale-105 transition-all duration-300">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 mb-4 group cursor-pointer hover:scale-110 transition-all duration-300">
            <i className="fas fa-sign-out-alt text-red-600 text-2xl transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Confirmer la déconnexion
          </h3>
          <div className="text-slate-600 mb-6">
            <p>
              Êtes-vous sûr de vouloir vous déconnecter ? Cette action
              fermera votre session actuelle.
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 font-medium hover:scale-105 hover:shadow-lg"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};
export default LogoutModal;
