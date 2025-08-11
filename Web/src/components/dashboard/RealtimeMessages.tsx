import React from 'react';
interface RealtimeMessagesProps {
  messages: any[];
}
const RealtimeMessages: React.FC<RealtimeMessagesProps> = ({ messages }) => {
  if (messages.length === 0) return null;
  return (
    <div className="relative z-10 p-4 md:p-6">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-lg border border-white/60 hover:shadow-xl transition-all duration-500">
        <div className="p-4 md:p-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-purple-50/60">
          <h3 className="text-lg md:text-xl font-semibold text-slate-800">
            Messages en temps réel
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {messages.slice(-4).map((message, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-50/70 transition-all duration-300">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                message.type === 'delivery' ? 'bg-blue-100 text-blue-600' :
                message.type === 'chat' ? 'bg-green-100 text-green-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                <i className={`fas ${
                  message.type === 'delivery' ? 'fa-truck' :
                  message.type === 'chat' ? 'fa-comment' :
                  'fa-bell'
                }`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 capitalize">
                  {message.type}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {JSON.stringify(message.data).substring(0, 40)}...
                </div>
                <div className="text-xs text-slate-400">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default RealtimeMessages;
