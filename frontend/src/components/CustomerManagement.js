import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Crown, 
  Phone, 
  Mail, 
  Calendar,
  Award,
  Star,
  TrendingUp,
  Eye,
  X,
  Upload,
  Download,
  FileText,
  CheckCircle
} from 'lucide-react';

const CustomerManagement = ({ apiRequest }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/customers', 'POST', formData);
      await fetchCustomers();
      setShowAddModal(false);
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/customers/${selectedCustomer.id}`, 'PUT', formData);
      await fetchCustomers();
      setShowEditModal(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database and loyalty program</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Loyalty Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.filter(c => c.total_points > 0).length}
              </p>
            </div>
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Points</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.total_points, 0) / customers.length) : 0}
              </p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Visits</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + c.total_visits, 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Customers ({filteredCustomers.length})</h2>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCustomers.map((customer, index) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(customer.loyalty_tier)}`}>
                          {customer.loyalty_tier}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{customer.total_points}</div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{customer.total_visits}</div>
                      <div className="text-sm text-gray-600">Visits</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailsModal(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Customer</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(selectedCustomer.loyalty_tier)}`}>
                    {selectedCustomer.loyalty_tier} Member
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">{selectedCustomer.total_points}</div>
                  <div className="text-blue-700 font-medium">Current Points</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600">{selectedCustomer.lifetime_points}</div>
                  <div className="text-purple-700 font-medium">Lifetime Points</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{selectedCustomer.total_visits}</div>
                  <div className="text-green-700 font-medium">Total Visits</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-lg font-bold text-orange-600">
                    {selectedCustomer.last_visit ? new Date(selectedCustomer.last_visit).toLocaleDateString() : 'Never'}
                  </div>
                  <div className="text-orange-700 font-medium">Last Visit</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedCustomer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Member since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;