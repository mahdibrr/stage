import React, { useState } from 'react';
interface Mission {
  id: string;
  client: string;
  driver: string;
  status: string;
  status_color: string;
  packages: number;
  date: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  address: string;
  phone: string;
}
interface RecentMissionsProps {
  missions?: Mission[];
}
const RecentMissions: React.FC<RecentMissionsProps> = ({ missions }) => {
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const defaultMissions: Mission[] = [
    {
      id: "DEL001",
      client: "TechCorp Inc.",
      driver: "John Smith",
      status: "Out for Delivery",
      status_color: "blue",
      packages: 3,
      date: "Jan 23, 2025",
      time: "2:30 PM",
      priority: "high",
      address: "123 Silicon Valley, San Francisco, CA",
      phone: "+1 (555) 123-4567"
    },
    {
      id: "DEL002",
      client: "Green Market Co.",
      driver: "Maria Garcia",
      status: "Scheduled",
      status_color: "yellow",
      packages: 2,
      date: "Jan 23, 2025",
      time: "3:45 PM",
      priority: "medium",
      address: "456 Organic Street, Portland, OR",
      phone: "+1 (555) 234-5678"
    },
    {
      id: "DEL003",
      client: "Fashion Boutique",
      driver: "David Chen",
      status: "Delivered",
      status_color: "green",
      packages: 1,
      date: "Jan 22, 2025",
      time: "10:15 AM",
      priority: "low",
      address: "789 Style Avenue, New York, NY",
      phone: "+1 (555) 345-6789"
    },
    {
      id: "DEL004",
      client: "Medical Supplies Ltd.",
      driver: "Sarah Johnson",
      status: "In Preparation",
      status_color: "purple",
      packages: 5,
      date: "Jan 23, 2025",
      time: "4:20 PM",
      priority: "high",
      address: "321 Health Boulevard, Boston, MA",
      phone: "+1 (555) 456-7890"
    }
  ];
  const missionData = missions || defaultMissions;
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'fas fa-exclamation-circle text-red-500';
      case 'medium': return 'fas fa-exclamation-triangle text-yellow-500';
      case 'low': return 'fas fa-info-circle text-blue-500';
      default: return 'fas fa-info-circle text-gray-500';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'out for delivery': return 'fas fa-truck';
      case 'scheduled': return 'fas fa-clock';
      case 'delivered': return 'fas fa-check-circle';
      case 'in preparation': return 'fas fa-box-open';
      case 'en route': return 'fas fa-route';
      default: return 'fas fa-circle';
    }
  };
  return (
    <div className="relative z-10 p-4 lg:p-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/70">
        {}
        <div className="p-4 md:p-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <i className="fas fa-clipboard-list text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                    Recent Deliveries
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600">Track and manage your delivery operations</p>
                </div>
              </div>
              {}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-700 hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <button className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs md:text-sm font-medium hover:bg-blue-200 hover:scale-105 transition-all duration-300 shadow-sm">
                  <i className="fas fa-eye text-xs"></i>
                  <span className="hidden sm:inline">View All</span>
                </button>
                <button className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs md:text-sm font-medium hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-300 shadow-lg">
                  <i className="fas fa-plus text-xs"></i>
                  <span className="hidden sm:inline">New Delivery</span>
                </button>
              </div>
            </div>
            {}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{missionData.length}</div>
                <div className="text-xs text-slate-600">Total</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-600">{missionData.filter(m => m.status === 'Delivered').length}</div>
                <div className="text-xs text-slate-600">Delivered</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{missionData.filter(m => m.status === 'Scheduled').length}</div>
                <div className="text-xs text-slate-600">Scheduled</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-red-600">{missionData.filter(m => m.priority === 'high').length}</div>
                <div className="text-xs text-slate-600">High Priority</div>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="p-4 md:p-6">
          {}
          <div className="hidden xl:block">
            <div className="space-y-2">
              {}
              <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-blue-50/60 to-purple-50/40 rounded-xl">
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-building text-xs text-blue-600"></i>
                  <span>Customer</span>
                </div>
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-user text-xs text-blue-600"></i>
                  <span>Driver</span>
                </div>
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-traffic-light text-xs text-blue-600"></i>
                  <span>Status</span>
                </div>
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt text-xs text-blue-600"></i>
                  <span>Address</span>
                </div>
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-clock text-xs text-blue-600"></i>
                  <span>Scheduled</span>
                </div>
                <div className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                  <i className="fas fa-cogs text-xs text-blue-600"></i>
                  <span>Actions</span>
                </div>
              </div>
              {}
              {missionData.map((mission) => (
                <div
                  key={mission.id}
                  className="grid grid-cols-6 gap-4 p-4 border border-slate-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300 rounded-xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {mission.id}
                      </span>
                      <i className={`${getPriorityIcon(mission.priority)} text-xs`}></i>
                    </div>
                    <div className="font-semibold text-slate-800">{mission.client}</div>
                    <div className="text-xs text-slate-500">{mission.phone}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {mission.driver.split(" ").map((n) => n[0]).join("")}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">{mission.driver}</div>
                      <div className="text-xs text-slate-500">{mission.packages} colis</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className={`${getStatusIcon(mission.status)} text-sm ${
                      mission.status_color === 'blue' ? 'text-blue-600' :
                      mission.status_color === 'yellow' ? 'text-yellow-600' :
                      mission.status_color === 'green' ? 'text-green-600' :
                      mission.status_color === 'purple' ? 'text-purple-600' :
                      'text-gray-600'
                    }`}></i>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      mission.status_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      mission.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      mission.status_color === 'green' ? 'bg-green-100 text-green-800' :
                      mission.status_color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mission.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-700 truncate">{mission.address}</div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                      View on map
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-700">{mission.date}</div>
                    <div className="text-xs text-slate-500">{mission.time}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-300">
                      <i className="fas fa-eye text-sm"></i>
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all duration-300">
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {}
          <div className="xl:hidden space-y-4">
            {missionData.map((mission) => (
              <div
                key={mission.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {mission.driver.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{mission.client}</div>
                      <div className="text-sm text-slate-600">{mission.driver}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {mission.id}
                    </span>
                    <i className={`${getPriorityIcon(mission.priority)} text-sm`}></i>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    <div className="flex items-center space-x-2">
                      <i className={`${getStatusIcon(mission.status)} text-sm ${
                        mission.status_color === 'blue' ? 'text-blue-600' :
                        mission.status_color === 'yellow' ? 'text-yellow-600' :
                        mission.status_color === 'green' ? 'text-green-600' :
                        mission.status_color === 'purple' ? 'text-purple-600' :
                        'text-gray-600'
                      }`}></i>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        mission.status_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        mission.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        mission.status_color === 'green' ? 'bg-green-100 text-green-800' :
                        mission.status_color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mission.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Packages</div>
                    <div className="flex items-center space-x-1">
                      <i className="fas fa-box text-blue-500 text-sm"></i>
                      <span className="font-medium">{mission.packages}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Address</div>
                    <div className="text-sm text-slate-700">{mission.address}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Scheduled</div>
                      <div className="text-sm font-medium">{mission.date} at {mission.time}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="text-sm text-blue-600">{mission.phone}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                  <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                    <i className="fas fa-map-marked-alt"></i>
                    <span>View on map</span>
                  </button>
                  <div className="flex space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300">
                      <i className="fas fa-eye text-sm"></i>
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-300">
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-300">
                      <i className="fas fa-route text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RecentMissions;
