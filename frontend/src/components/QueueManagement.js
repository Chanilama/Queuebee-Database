import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Crown, 
  Award, 
  Star,
  Plus,
  Search,
  AlertCircle,
  TrendingUp,
  Zap,
  Gift,
  Timer,
  Phone,
  Mail
} from 'lucide-react';

const QueueManagement = ({ apiRequest }) => {
  const [queue, setQueue] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serviceType, setServiceType] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);

  const serviceTypes = [
    'Haircut',
    'Hair Coloring',
    'Hair Styling',
    'Manicure',
    'Pedicure',
    'Facial',
    'Massage',
    'Eyebrow Threading',
    'General'
  ];

  useEffect(() => {
    fetchQueue();
    fetchCustomers();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await apiRequest('/queue', 'GET');
      setQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiRequest('/customers', 'GET');
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await apiRequest('/checkin', 'POST', {
        customer_id: selectedCustomer.id,
        service_type: serviceType
      });

      setCheckInResult(response);
      await fetchQueue();
      setShowCheckInModal(false);
      setSelectedCustomer(null);
      setServiceType('General');
      setSearchTerm('');

      // Show success message for 5 seconds
      setTimeout(() => setCheckInResult(null), 5000);
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  const handleCompleteService = async (queueId) => {
    try {
      await apiRequest(`/queue/${queueId}/complete`, 'PUT');
      await fetchQueue();
    } catch (error) {
      console.error('Error completing service:', error);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return 'text-orange-600 bg-orange-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'Platinum': return <Crown className="w-4 h-4" />;
      case 'Gold': return <Award className="w-4 h-4" />;
      case 'Silver': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const queueStats = {
    total: queue.length,
    avgWaitTime: queue.length > 0 ? Math.round(queue.reduce((sum, item) => sum + item.estimated_wait, 0) / queue.length) : 0,
    totalPointsToday: queue.reduce((sum, item) => sum + (item.points_awarded || 0), 0),
    vipCustomers: queue.filter(item => {
      const customer = customers.find(c => c.id === item.customer_id);
      return customer && ['Gold', 'Platinum'].includes(customer.loyalty_tier);
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Management</h1>
          <p className="text-gray-600">Manage customer check-ins and reward loyalty points</p>
        </div>
        <button
          onClick={() => setShowCheckInModal(true)}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Check In Customer</span>
        </button>
      </div>

      {/* Check-in Success Message */}
      {checkInResult && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">Check-in Successful! 🎉</h3>
              <p className="text-green-100">
                <strong>{customers.find(c => c.id === queue[queue.length - 1]?.customer_id)?.name}</strong> earned{' '}
                <strong>{checkInResult.points_awarded} points</strong>
                {checkInResult.tier_upgraded && (
                  <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
                    🎊 Upgraded to {checkInResult.loyalty_tier}!
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Current Queue</p>
              <p className="text-3xl font-bold text-gray-900">{queueStats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 text-blue-600 text-sm">
            {queueStats.total > 0 ? 'Active queue' : 'No customers waiting'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Wait Time</p>
              <p className="text-3xl font-bold text-gray-900">{queueStats.avgWaitTime} min</p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 text-green-600 text-sm">Per customer</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Points Awarded</p>
              <p className="text-3xl font-bold text-gray-900">{queueStats.totalPointsToday}</p>
            </div>
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 text-purple-600 text-sm">Today's total</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">VIP Customers</p>
              <p className="text-3xl font-bold text-gray-900">{queueStats.vipCustomers}</p>
            </div>
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-2 text-yellow-600 text-sm">Gold & Platinum</div>
        </div>
      </div>

      {/* Current Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Current Queue</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers in queue</h3>
            <p className="text-gray-600 mb-6">Check in your first customer to get started</p>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Check In Customer
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue.map((queueItem, index) => {
              const customer = customers.find(c => c.id === queueItem.customer_id);
              const isNext = index === 0;

              return (
                <div 
                  key={queueItem.id} 
                  className={`p-6 transition-all ${isNext ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        isNext ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-purple-600'
                      }`}>
                        {queueItem.position}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{queueItem.customer_name}</h3>
                          {customer && (
                            <>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTierColor(customer.loyalty_tier)}`}>
                                {getTierIcon(customer.loyalty_tier)}
                                <span>{customer.loyalty_tier}</span>
                              </span>
                              {isNext && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium animate-bounce">
                                  🔔 Next Customer
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{queueItem.service_type}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{queueItem.estimated_wait} min wait</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Gift className="w-4 h-4" />
                            <span>+{queueItem.points_awarded} points</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Checked in</div>
                        <div className="font-medium">
                          {new Date(queueItem.checkin_time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {isNext && (
                        <button
                          onClick={() => handleCompleteService(queueItem.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete Service</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          isNext ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                        }`}
                        style={{ width: `${Math.max(10, 100 - (queueItem.position * 15))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Check In Customer</h2>
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setSelectedCustomer(null);
                  setSearchTerm('');
                  setServiceType('General');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Customer List */}
                {searchTerm && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No customers found
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setSearchTerm(customer.name);
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.phone}</div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer.loyalty_tier)}`}>
                                {customer.loyalty_tier}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">{customer.total_points} pts</div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Info */}
              {selectedCustomer && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedCustomer.total_points} points • {selectedCustomer.loyalty_tier} member
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {serviceTypes.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowCheckInModal(false);
                    setSelectedCustomer(null);
                    setSearchTerm('');
                    setServiceType('General');
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={!selectedCustomer}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;