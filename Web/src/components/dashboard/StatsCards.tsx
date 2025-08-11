import React from 'react';
interface Stat {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend: string;
  trendType: 'up' | 'down';
}
interface StatsCardsProps {
  stats: Stat[];
}
const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="group bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl p-4 md:p-6 border border-white/60 hover:border-blue-200/50 hover:scale-[1.03] transition-all duration-700 cursor-pointer relative overflow-hidden hover:bg-white/90"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/30 transition-all duration-500 ease-out rounded-3xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 ease-out border border-blue-100 group-hover:border-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              <i
                className={`${stat.icon} text-blue-600 text-lg transition-all duration-500 ease-out group-hover:scale-125 group-hover:text-blue-700 group-hover:drop-shadow-md relative z-10`}
              ></i>
              <div className="absolute inset-0 bg-blue-400/0 group-hover:bg-blue-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out rounded-xl"></div>
            </div>
            <div
              className={`flex items-center text-sm font-medium transition-all duration-500 group-hover:scale-110 ${
                stat.trendType === "up"
                  ? "text-green-600 group-hover:text-green-700"
                  : "text-red-600 group-hover:text-red-700"
              }`}
            >
              <i
                className={`fas fa-arrow-${stat.trendType} mr-1 text-xs transition-all duration-500 group-hover:animate-bounce group-hover:scale-125`}
              ></i>
              <span className="transition-all duration-500 group-hover:font-bold group-hover:tracking-wide">
                {stat.trend}
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-xs md:text-sm lg:text-base font-medium text-slate-600 mb-1 group-hover:text-slate-700 transition-all duration-300">
              {stat.title}
            </h3>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 group-hover:text-slate-900 transition-all duration-300">
              {stat.value}
            </p>
          </div>
          <div className="mt-2 md:mt-3 text-xs text-slate-500 group-hover:text-slate-600 transition-all duration-300 relative z-10">depuis hier</div>
        </div>
      ))}
    </div>
  );
};
export default StatsCards;
