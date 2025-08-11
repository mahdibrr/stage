import React, { useState } from 'react';
interface Delivery {
  id: string;
  customer: string;
  address: string;
  priority: 'high' | 'medium' | 'low';
  timeWindow: string;
  packages: number;
  estimatedTime: number;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed';
}
interface Driver {
  id: string;
  name: string;
  vehicle: string;
  capacity: number;
  workingHours: string;
  currentLocation: string;
  status: 'available' | 'busy' | 'offline';
}
interface RouteOptimizationProps {
  deliveries?: Delivery[];
  drivers?: Driver[];
}
const RoutePlanning: React.FC<RouteOptimizationProps> = ({ deliveries, drivers }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizationMode, setOptimizationMode] = useState<'time' | 'distance' | 'cost'>('time');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const defaultDeliveries: Delivery[] = [
    {
      id: "D001",
      customer: "Tech Corp",
      address: "123 Silicon Valley, CA",
      priority: "high",
      timeWindow: "9:00 AM - 11:00 AM",
      packages: 3,
      estimatedTime: 15,
      status: "unassigned"
    },
    {
      id: "D002", 
      customer: "Green Market",
      address: "456 Organic St, CA",
      priority: "medium",
      timeWindow: "10:00 AM - 2:00 PM",
      packages: 5,
      estimatedTime: 20,
      status: "assigned"
    },
    {
      id: "D003",
      customer: "Fashion Boutique",
      address: "789 Style Ave, CA",
      priority: "low",
      timeWindow: "2:00 PM - 5:00 PM",
      packages: 2,
      estimatedTime: 10,
      status: "in-progress"
    },
    {
      id: "D004",
      customer: "Medical Supplies Co",
      address: "321 Health Blvd, CA",
      priority: "high",
      timeWindow: "8:00 AM - 10:00 AM",
      packages: 1,
      estimatedTime: 8,
      status: "unassigned"
    }
  ];
  const defaultDrivers: Driver[] = [
    {
      id: "DR001",
      name: "John Smith",
      vehicle: "Van - V123",
      capacity: 50,
      workingHours: "8:00 AM - 6:00 PM",
      currentLocation: "Warehouse A",
      status: "available"
    },
    {
      id: "DR002", 
      name: "Maria Garcia",
      vehicle: "Truck - T456",
      capacity: 80,
      workingHours: "9:00 AM - 5:00 PM",
      currentLocation: "Downtown Hub",
      status: "busy"
    },
    {
      id: "DR003",
      name: "David Chen",
      vehicle: "Van - V789",
      capacity: 45,
      workingHours: "7:00 AM - 4:00 PM",
      currentLocation: "Suburb Route",
      status: "available"
    }
  ];
  const deliveryData = deliveries || defaultDeliveries;
  const driverData = drivers || defaultDrivers;
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unassigned': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const handleOptimizeRoutes = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 3000);
  };
  return (
    <div className="space-y-6 p-6">
      {}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/70 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <i className="fas fa-route text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Route Planning & Optimization</h1>
              <p className="text-slate-600">Optimize delivery routes for maximum efficiency</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value as 'time' | 'distance' | 'cost')}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="time">Optimize by Time</option>
              <option value="distance">Optimize by Distance</option>
              <option value="cost">Optimize by Cost</option>
            </select>
            <button
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>Optimize Routes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/70">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-box text-blue-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Pending Deliveries</h3>
                  <p className="text-sm text-slate-600">{deliveryData.length} deliveries to schedule</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Delivery
              </button>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {deliveryData.map((delivery) => (
                <div key={delivery.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-slate-800">{delivery.customer}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(delivery.priority)}`}>
                          {delivery.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{delivery.address}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span><i className="fas fa-clock mr-1"></i>{delivery.timeWindow}</span>
                        <span><i className="fas fa-box mr-1"></i>{delivery.packages} packages</span>
                        <span><i className="fas fa-stopwatch mr-1"></i>{delivery.estimatedTime}min</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/70">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-users text-green-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Available Drivers</h3>
                  <p className="text-sm text-slate-600">{driverData.filter(d => d.status === 'available').length} drivers ready</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <i className="fas fa-user-plus mr-2"></i>Add Driver
              </button>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {driverData.map((driver) => (
                <div key={driver.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{driver.name}</h4>
                        <p className="text-sm text-slate-600">{driver.vehicle}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getDriverStatusColor(driver.status)}`}>
                      {driver.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-medium">Capacity:</span> {driver.capacity} packages
                    </div>
                    <div>
                      <span className="font-medium">Hours:</span> {driver.workingHours}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Location:</span> {driver.currentLocation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/70 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <i className="fas fa-chart-line text-purple-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Route Summary</h3>
            <p className="text-sm text-slate-600">Optimization results and metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-sm text-blue-700">Optimized Routes</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">127mi</div>
            <div className="text-sm text-green-700">Total Distance</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">4.2h</div>
            <div className="text-sm text-yellow-700">Estimated Time</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">$240</div>
            <div className="text-sm text-purple-700">Cost Savings</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoutePlanning;
