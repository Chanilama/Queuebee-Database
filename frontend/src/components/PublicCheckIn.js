import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Crown, 
  Gift,
  Star,
  Award,
  Loader,
  AlertCircle
} from 'lucide-react';

const PublicCheckIn = () => {
  const { salonId } = useParams();
  const [salon, setSalon] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [error, setError] = useState('');
  
  // Customer state
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    email: '',
    agreeToNewsletter: false
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (salonId) {
      fetchSalonInfo();
      fetchQueue();
      
      // Set up real-time queue updates
      const interval = setInterval(fetchQueue, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [salonId]);

  const fetchSalonInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/salon/${salonId}`);
      if (response.ok) {
        const data = await response.json();
        setSalon(data);
      }
    } catch (error) {
      console.error('Error fetching salon info:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/queue/${salonId}`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data || []);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Check customer when phone number changes
    if (name === 'phone' && value.length >= 10) {
      checkCustomerExists(value);
    } else if (name === 'phone' && value.length < 10) {
      // Reset customer state if phone is too short
      setExistingCustomer(null);
      setIsFirstTime(null);
    }
  };

  const checkCustomerExists = async (phone) => {
    if (!phone || phone.length < 10) return;
    
    setCheckingCustomer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/check-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salon_id: salonId,
          phone: phone
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setExistingCustomer(data.customer);
          setIsFirstTime(false);
          // Pre-populate name and email for returning customer
          setFormData(prev => ({
            ...prev,
            firstName: data.customer.name,
            email: data.customer.email || ''
          }));
        } else {
          setExistingCustomer(null);
          setIsFirstTime(true);
          // Clear name and email for new customer
          setFormData(prev => ({
            ...prev,
            firstName: '',
            email: ''
          }));
        }
      }
    } catch (error) {
      console.error('Error checking customer:', error);
    } finally {
      setCheckingCustomer(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // First, create or find the customer
      const customerResponse = await fetch(`${API_BASE_URL}/api/public/customer-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salon_id: salonId,
          name: formData.firstName,
          email: formData.email,
          phone: formData.phone,
          service_type: 'Walk-in'
        })
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.detail || 'Check-in failed');
      }

      const result = await customerResponse.json();
      setCheckInResult(result);
      
      // Clear form
      setFormData({
        firstName: '',
        email: '',
        phone: '',
        agreeToNewsletter: false
      });
      
      // Refresh queue
      await fetchQueue();
      
      // Hide success message after 8 seconds
      setTimeout(() => setCheckInResult(null), 8000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
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

  if (!salon && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Not Found</h2>
          <p className="text-gray-600">The salon you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">QueueBee</h1>
                {salon && (
                  <p className="text-gray-600">{salon.salon_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Queue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {checkInResult && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2">🎉 Check-in Successful!</h3>
                <div className="space-y-1">
                  <p className="text-green-100">
                    <strong>{checkInResult.customer_name}</strong> is now in the queue!
                  </p>
                  <p className="text-green-100">
                    <strong>Position:</strong> #{checkInResult.queue_entry?.position} • 
                    <strong> Wait Time:</strong> ~{checkInResult.queue_entry?.estimated_wait} minutes
                  </p>
                  <p className="text-green-100">
                    <strong>Points Earned:</strong> +{checkInResult.points_awarded} points! 
                    {checkInResult.tier_upgraded && (
                      <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        🎊 Upgraded to {checkInResult.loyalty_tier}!
                      </span>
                    )}
                  </p>
                  <p className="text-green-100 text-sm">
                    <strong>Total Points:</strong> {checkInResult.total_points} • 
                    <strong> Loyalty Tier:</strong> {checkInResult.loyalty_tier}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Check-In Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Check-In</h2>
              {salon && (
                <p className="text-gray-600 text-lg">{salon.salon_name}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCheckIn} className="space-y-6">
              {/* Phone Number - Always shown first */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +1
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                    required
                  />
                  {checkingCustomer && (
                    <div className="flex items-center pl-3">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Required for queue notifications and loyalty points
                </p>
              </div>

              {/* Welcome message for returning customers */}
              {existingCustomer && !isFirstTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Welcome back, {existingCustomer.name}! 👋
                      </h3>
                      <p className="text-green-700 text-sm">
                        {existingCustomer.loyalty_tier} member • {existingCustomer.total_points} points • {existingCustomer.total_visits} visits
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* First time customer message */}
              {isFirstTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        Welcome to {salon?.salon_name}! 🎉
                      </h3>
                      <p className="text-blue-700 text-sm">
                        As a new customer, please provide your details below to earn loyalty points!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email - Required for first time, optional for returning */}
              {(isFirstTime !== null) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address {isFirstTime ? <span className="text-red-500">*</span> : '(Optional)'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email address"
                    required={isFirstTime}
                    disabled={!isFirstTime && existingCustomer}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {isFirstTime ? 'Required for first-time customers. ' : ''}
                    Provide your email address to subscribe and earn bonus points
                  </p>
                </div>
              )}

              {/* Name - Only for first time customers */}
              {isFirstTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your first name"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Only required for first-time customers
                  </p>
                </div>
              )}

              {/* Newsletter agreement - Only show if customer state is determined */}
              {(isFirstTime !== null) && (
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToNewsletter"
                      checked={formData.agreeToNewsletter}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to receive newsletters and accept the data privacy statement. 
                      You may unsubscribe at any time using the link in our newsletter.
                    </span>
                  </label>

                  <div className="text-xs text-gray-600 leading-relaxed">
                    We use QueueBee as our marketing platform. By submitting this form you agree 
                    that the personal data you provided will be transferred to QueueBee for 
                    processing in accordance with QueueBee privacy policy.
                  </div>
                </div>
              )}

              {/* Submit button - Show different states */}
              <button
                type="submit"
                disabled={
                  submitting || 
                  !formData.phone || 
                  (isFirstTime && (!formData.firstName || !formData.email)) ||
                  (isFirstTime === null)
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Checking In...</span>
                  </>
                ) : isFirstTime === null ? (
                  <span>Enter Phone Number</span>
                ) : existingCustomer ? (
                  <span>Check-In Now</span>
                ) : (
                  <span>Join & Check-In</span>
                )}
              </button>
            </form>
          </div>

          {/* Current Queue */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">Current Queue</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live Updates</span>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                {queue.length === 0 ? 'No one in queue' : `${queue.length} people in line`}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Queue</h4>
                  <p className="text-gray-600">You'll be first in line! Check in now.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {queue.slice(0, 10).map((item, index) => (
                    <div key={item.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' : 
                          index === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                          'bg-gradient-to-br from-blue-600 to-purple-600'
                        }`}>
                          #{item.position}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {item.customer_name.charAt(0).toUpperCase() + item.customer_name.slice(1)}
                            </span>
                            {item.customer_tier && item.customer_tier !== 'Bronze' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTierColor(item.customer_tier)}`}>
                                {getTierIcon(item.customer_tier)}
                                <span>{item.customer_tier}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{item.service_type}</span>
                            {item.points_awarded && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <Gift className="w-3 h-3" />
                                  <span>+{item.points_awarded} pts</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{item.estimated_wait} min</span>
                        </div>
                        {index === 0 && (
                          <span className="text-green-600 text-sm font-medium">Being served</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Queue Stats */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {queue.length > 0 ? Math.round(queue.reduce((sum, item) => sum + item.estimated_wait, 0) / queue.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Wait Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {queue.reduce((sum, item) => sum + (item.points_awarded || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Points Awarded Today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCheckIn;