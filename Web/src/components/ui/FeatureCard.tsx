import React from 'react';
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="group flex items-start gap-4 p-5 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:shadow-2xl hover:scale-105 cursor-pointer relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
    <div className="relative p-3 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:bg-white/30 group-hover:shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-2xl"></div>
      <div className="relative z-10">
        {icon}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-100 transition-all duration-300">{title}</h3>
      <p className="text-white/80 group-hover:text-white/90 transition-all duration-300">{description}</p>
    </div>
  </div>
);
