import React, { useState } from "react";
import { type User, type ConnectionStatus as ConnectionStatusType, type RealtimeMessage } from '../../types';
import Sidebar from './Sidebar';
import StatsCards from './StatsCards';
import RecentMissions from './RecentMissions';
import RealtimeMessages from './RealtimeMessages';
import LogoutModal from './LogoutModal';
import ConnectionStatus from './ConnectionStatus';
interface DashboardProps {
  user: User;
  onLogout: () => void;
  centrifugoStatus: ConnectionStatusType;
  realtimeMessages?: RealtimeMessage[];
}
const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  centrifugoStatus,
  realtimeMessages = []
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };
  const handleMenuItemClick = (itemId: string) => {
    setActiveSection(itemId);
    setSidebarOpen(false);
  };
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-chart-pie",
      color: "blue",
    },
    {
      id: "routes",
      label: "Route Planning",
      icon: "fas fa-route",
      color: "green",
      hasNotification: realtimeMessages.filter(m => m.type === 'delivery').length > 0,
    },
    { id: "deliveries", label: "Deliveries", icon: "fas fa-truck", color: "purple" },
    { id: "drivers", label: "Drivers", icon: "fas fa-users", color: "indigo" },
    { id: "customers", label: "Customers", icon: "fas fa-building", color: "amber" },
    { id: "analytics", label: "Analytics", icon: "fas fa-chart-line", color: "emerald" },
    { id: "settings", label: "Settings", icon: "fas fa-cog", color: "slate" },
  ];
  const stats = [
    {
      title: "Active Routes",
      value: "12",
      icon: "fas fa-route",
      color: "blue",
      trend: "+15%",
      trendType: "up" as const,
    },
    {
      title: "Deliveries Today",
      value: "156",
      icon: "fas fa-truck",
      color: "green",
      trend: "+8%",
      trendType: "up" as const,
    },
    {
      title: "On-Time Rate",
      value: "94%",
      icon: "fas fa-clock",
      color: "emerald",
      trend: "+2%",
      trendType: "up" as const,
    },
    {
      title: "Cost Savings",
      value: "$2.4K",
      icon: "fas fa-dollar-sign",
      color: "purple",
      trend: "+18%",
      trendType: "up" as const,
    },
  ];
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 min-h-screen">
      <ConnectionStatus status={centrifugoStatus} />
      {}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="relative w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center hover:shadow-2xl hover:scale-110 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-700 ease-out group active:scale-95 overflow-hidden"
          aria-label="Open sidebar"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/0 via-purple-400/0 to-indigo-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/15 group-hover:to-indigo-400/10 transition-all duration-700 ease-out"></div>
          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-200/50 transition-all duration-700"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-300/0 to-purple-300/0 group-hover:from-blue-300/30 group-hover:to-purple-300/20 opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-700"></div>
          <div className="flex flex-col space-y-1.5 relative z-10">
            <span className="block w-6 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:w-7 group-hover:h-1 group-hover:rotate-12 group-hover:translate-y-1 group-hover:shadow-lg group-hover:shadow-blue-200/50 origin-left transform"></span>
            <span className="block w-6 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out delay-75 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:w-8 group-hover:h-1 group-hover:shadow-lg group-hover:shadow-purple-200/50 group-hover:animate-pulse"></span>
            <span className="block w-6 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out delay-150 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-600 group-hover:w-7 group-hover:h-1 group-hover:-rotate-12 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-indigo-200/50 origin-left transform"></span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/30 group-hover:to-purple-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out -z-10"></div>
        </button>
      </div>
      <div className="min-h-screen">
        {}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        {}
        <Sidebar
          user={user}
          menuItems={menuItems}
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          realtimeMessages={realtimeMessages}
          onMenuItemClick={handleMenuItemClick}
          onCloseSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        {}
        <main className="flex-1 bg-gradient-to-br from-transparent via-blue-50/20 to-purple-50/10 md:ml-60 min-h-screen">
          {}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
          </div>
          {}
          <StatsCards stats={stats} />
          {}
          <RecentMissions />
          {}
          <RealtimeMessages messages={realtimeMessages} />
        </main>
      </div>
      {}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
      {}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};
export default Dashboard;
