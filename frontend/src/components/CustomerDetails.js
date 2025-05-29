import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  Star, 
  Crown, 
  Gift,
  Edit,
  Save,
  Trash2,
  ArrowLeft,
  History,
  StickyNote,
  Plus,
  Minus
} from 'lucide-react';

const CustomerDetails = ({ customer, apiRequest, onClose, onCustomerUpdated }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingPoints, setEditingPoints] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [points, setPoints] = useState(customer?.total_points || 0);
  const [notes, setNotes] = useState(customer?.notes || '');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setPoints(customer.total_points || 0);
      setNotes(customer.notes || '');
      if (activeTab === 'history') {
        fetchPointsHistory();
      }
    }
  }, [customer, activeTab]);

  const fetchPointsHistory = async () => {
    try {
      const history = await apiRequest(`/customers/${customer.id}/points-history`);
      setPointsHistory(history || []);
    } catch (error) {
      console.error('Error fetching points history:', error);
    }
  };

  const handleSavePoints = async () => {
    setLoading(true);
    try {
      const result = await apiRequest(`/customers/${customer.id}/points`, 'PUT', {
        points: parseInt(points),
        reason: `Manual adjustment to ${points} points`
      });
      
      setEditingPoints(false);
      onCustomerUpdated(result.customer);
      
      // Refresh points history if on that tab
      if (activeTab === 'history') {
        fetchPointsHistory();
      }
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Failed to update points');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const result = await apiRequest(`/customers/${customer.id}`, 'PUT', {
        notes: notes
      });
      
      setEditingNotes(false);
      onCustomerUpdated(result.customer);
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await apiRequest(`/customers/${customer.id}`, 'DELETE');
        onClose();
        // Refresh customer list
        window.location.reload();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      } finally {
        setLoading(false);
      }
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Silver': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'Gold': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Platinum': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'Platinum': return <Crown className="w-5 h-5" />;
      case 'Gold': return <Award className="w-5 h-5" />;
      case 'Silver': return <Star className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'notes', name: 'Notes', icon: StickyNote },
    { id: 'history', name: 'History', icon: History }
  ];

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getTierColor(customer.loyalty_tier)}`}>
                {getTierIcon(customer.loyalty_tier)}
                <span>{customer.loyalty_tier} Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Member since {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Points Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Loyalty Points</h3>
                  <button
                    onClick={() => setEditingPoints(!editingPoints)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                {editingPoints ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <button
                        onClick={() => setPoints(Math.max(0, points - 10))}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 text-center text-2xl font-bold border border-gray-300 rounded-lg py-2"
                        min="0"
                      />
                      <button
                        onClick={() => setPoints(points + 10)}
                        className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingPoints(false);
                          setPoints(customer.total_points);
                        }}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePoints}
                        disabled={loading}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{customer.total_points}</div>
                      <div className="text-blue-700 font-medium">Current Points</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">{customer.lifetime_points}</div>
                      <div className="text-purple-700 font-medium">Lifetime Points</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Visit Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{customer.total_visits}</div>
                    <div className="text-green-700 font-medium">Total Visits</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
                    </div>
                    <div className="text-orange-700 font-medium">Last Visit</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Customer Notes</h3>
                <button
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              {editingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this customer..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(customer.notes || '');
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Notes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                  {notes ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet. Click edit to add notes about this customer.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Points History</h3>
              
              {pointsHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No points history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((transaction, index) => (
                    <div key={transaction.id || index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.points > 0 ? '+' : ''}{transaction.points} points
                          </p>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'earned' 
                            ? 'bg-green-100 text-green-700'
                            : transaction.transaction_type === 'manual_adjustment'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {transaction.transaction_type === 'earned' ? 'Earned' : 
                           transaction.transaction_type === 'manual_adjustment' ? 'Adjusted' : 'Other'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={handleDeleteCustomer}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;