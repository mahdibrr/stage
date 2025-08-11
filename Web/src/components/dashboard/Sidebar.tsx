import React from 'react';
import { type User } from '../../types';
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  hasNotification?: boolean;
}
interface SidebarProps {
  user: User;
  menuItems: MenuItem[];
  activeSection: string;
  sidebarOpen: boolean;
  realtimeMessages: any[];
  onMenuItemClick: (itemId: string) => void;
  onCloseSidebar: () => void;
  onLogout: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  user,
  menuItems,
  activeSection,
  sidebarOpen,
  realtimeMessages,
  onMenuItemClick,
  onCloseSidebar,
  onLogout
}) => {
  return (
    <aside
      className={`fixed z-50 top-0 left-0 h-dvh w-60 bg-gradient-to-br from-white/95 via-blue-50/80 to-indigo-50/70 backdrop-blur-lg text-slate-800 flex flex-col border-r border-blue-200/60 shadow-2xl transform transition-transform duration-300 overflow-hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:z-50`}
      style={{ height: '100dvh' }}
    >
      {}
      <div className="md:hidden flex justify-end p-2 flex-shrink-0">
        <button
          onClick={onCloseSidebar}
          className="relative w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all duration-300 group shadow-md hover:scale-110 border border-red-100"
        >
          <i className="fas fa-times text-red-600 text-sm group-hover:rotate-90 transition-all duration-300"></i>
        </button>
      </div>
      {}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuItemClick(item.id)}
            className={`relative w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group text-base ${
              activeSection === item.id
                ? "bg-white shadow-xl text-blue-700 scale-[1.02] border-l-4 border-blue-500"
                : "hover:bg-white/70 hover:text-blue-800 hover:scale-[1.01] hover:shadow-lg"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 text-sm ${
                activeSection === item.id
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-blue-50 text-blue-600 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-700"
              } ${item.hasNotification ? "ring-2 ring-green-300 group-hover:ring-green-400" : ""}`}
            >
              <i className={`${item.icon} ${activeSection === item.id ? "scale-110" : "group-hover:scale-125"} transition-all duration-500`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold truncate">
                {item.label}
              </span>
            </div>
            {item.hasNotification && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                  {realtimeMessages.filter(m =>
                    (item.id === 'missions' && m.type === 'delivery') ||
                    (item.id === 'messages' && m.type === 'chat') ||
                    (item.id === 'notifications' && m.type === 'notification')
                  ).length}
                </span>
              </div>
            )}
          </button>
        ))}
      </nav>
      {}
      <div className="p-3 border-t border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-blue-100 font-bold shadow-md text-sm">
              {user?.fullName?.substring(0, 2).toUpperCase() || 'U?'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate text-sm">
              {user?.fullName || 'Unknown User'}
            </div>
            <div className="text-xs text-slate-600 truncate">
              {user?.email || 'No email'}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 hover:scale-105 transition-all duration-300 shadow-sm group border border-red-200/50 text-sm"
        >
          <i className="fas fa-sign-out-alt transition-all duration-300 group-hover:rotate-12 text-xs"></i>
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;