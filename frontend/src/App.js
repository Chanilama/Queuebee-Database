import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Import Lucide React icons
import { 
  Clock, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Zap,
  CheckCircle,
  Star,
  Menu,
  X,
  ArrowRight,
  Play,
  Calendar,
  MessageSquare,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Gift,
  Award,
  Target,
  CreditCard,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin,
  Crown
} from 'lucide-react';

// Auth Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// API Configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API_URL = `${API_BASE_URL}/api`;

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('queuebee_token');
    const userData = localStorage.getItem('queuebee_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/salon/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('queuebee_token', data.access_token);
      localStorage.setItem('queuebee_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/salon/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('queuebee_token', data.access_token);
      localStorage.setItem('queuebee_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('queuebee_token');
    localStorage.removeItem('queuebee_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Landing Page Component
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Self-Service Platform",
      description: "Salon owners can create accounts and manage their business independently"
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Customer Loyalty Points",
      description: "Reward customers with points for every check-in and build loyalty"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Customer Management",
      description: "Complete customer database with visit history and preferences"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Real-Time Queue",
      description: "Live queue management with wait time predictions"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Loyalty Tiers",
      description: "Bronze, Silver, Gold, and Platinum tiers with increasing rewards"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile-First Design",
      description: "Perfect experience on tablets and mobile devices for easy check-ins"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐝</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                QueueBee
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              {user ? (
                <Link to="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
                  <Link to="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
                {user ? (
                  <Link to="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-center hover:shadow-lg transition-all">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
                    <Link to="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-center hover:shadow-lg transition-all">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Self-Service
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Salon Management
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Empower salon owners to manage their business independently. Create your account, 
                manage customers, and reward loyalty with our points-based system. Perfect for salons, spas, and service businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center group">
                  Start Your Free Account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300 flex items-center justify-center group">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-gray-600 text-sm">Salon Partners</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-purple-600">50K+</div>
                  <div className="text-gray-600 text-sm">Happy Customers</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-green-600">1M+</div>
                  <div className="text-gray-600 text-sm">Points Awarded</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3992878/pexels-photo-3992878.jpeg" 
                alt="Salon management tools" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl"></div>
              
              {/* Floating loyalty card */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Loyalty Rewards</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">+10 Points</div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4">
                <div className="text-sm text-gray-600">Customer Database</div>
                <div className="text-2xl font-bold text-purple-600">1,247</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow Your Salon Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete self-service platform designed specifically for salon owners who want to manage their business efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300">
                  <div className="text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Salon Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of salon owners already using QueueBee to improve customer experience and build loyalty
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Create Your Account
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🐝</span>
                </div>
                <span className="text-xl font-bold text-white">QueueBee</span>
              </div>
              <p className="text-gray-400">
                Self-service salon management for the digital age.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 QueueBee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">🐝</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your salon account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register Component
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    salon_name: '',
    owner_name: '',
    phone: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">🐝</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="text-gray-600 mt-2">Start managing your salon today</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salon Name
              </label>
              <input
                type="text"
                name="salon_name"
                value={formData.salon_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your salon name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salon Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your salon address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component (placeholder for now)
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🐝</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">QueueBee Dashboard</h1>
                <p className="text-sm text-gray-600">{user?.salon_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to QueueBee, {user?.owner_name}!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your self-service salon management platform is ready. Start managing customers and building loyalty with points!
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-blue-50 rounded-lg p-6">
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Customer Management</h3>
              <p className="text-gray-600 text-sm">Add and manage your customer database with complete profiles and visit history.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <Crown className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Loyalty Points</h3>
              <p className="text-gray-600 text-sm">Reward customers with points for every check-in and track their loyalty tiers.</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <BarChart3 className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">Get insights into your business performance and customer behavior.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/`);
        const data = await response.json();
        setApiResponse(data);
      } catch (error) {
        console.error('API Error:', error);
        setApiResponse({ error: 'Failed to connect to backend' });
      }
    };

    testAPI();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* API Status Indicator */}
          {apiResponse && (
            <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border z-50">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiResponse.error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {apiResponse.error ? 'Backend Offline' : 'API Connected'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;