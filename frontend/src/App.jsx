import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, MessageSquare, FileText, Shield, Menu, X, LogOut, Home } from 'lucide-react';

// Mock API Service
const API_BASE = '/api';
const mockAPI = {
  currentUser: null,
  users: [],
  transactions: [],
  loanProducts: [
    { id: 1, lender_name: "MicroFin Bank", min_amount: 50000, max_amount: 500000, interest_rate: 12.5, min_tenure: 12, max_tenure: 60, min_income: 20000, max_debt_ratio: 0.4, min_health_score: 50 },
    { id: 2, lender_name: "SME Credit Union", min_amount: 100000, max_amount: 1000000, interest_rate: 11.0, min_tenure: 24, max_tenure: 84, min_income: 40000, max_debt_ratio: 0.35, min_health_score: 60 },
    { id: 3, lender_name: "Business Growth NBFC", min_amount: 25000, max_amount: 300000, interest_rate: 14.0, min_tenure: 6, max_tenure: 36, min_income: 15000, max_debt_ratio: 0.45, min_health_score: 40 },
    { id: 4, lender_name: "QuickCash Lenders", min_amount: 10000, max_amount: 200000, interest_rate: 15.5, min_tenure: 6, max_tenure: 24, min_income: 10000, max_debt_ratio: 0.5, min_health_score: 35 },
    { id: 5, lender_name: "Prime Business Finance", min_amount: 200000, max_amount: 2000000, interest_rate: 10.0, min_tenure: 36, max_tenure: 120, min_income: 60000, max_debt_ratio: 0.3, min_health_score: 70 }
  ],
  loanApplications: [],
  riskFlags: [],

  async login(email, password) {
    await new Promise(r => setTimeout(r, 500));
    const user = this.users.find(u => u.email === email);
    if (user && password === 'password') {
      this.currentUser = user;
      return { success: true, user, token: 'mock-jwt-token' };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  async register(userData) {
    await new Promise(r => setTimeout(r, 500));
    const newUser = {
      id: this.users.length + 1,
      ...userData,
      role: userData.role || 'BORROWER',
      created_at: new Date().toISOString()
    };
    this.users.push(newUser);
    return { success: true, user: newUser };
  },

  async getTransactions(userId) {
    await new Promise(r => setTimeout(r, 300));
    return this.transactions.filter(t => t.user_id === userId);
  },

  async addTransaction(transaction) {
    await new Promise(r => setTimeout(r, 300));
    const newTx = {
      id: this.transactions.length + 1,
      ...transaction,
      date: transaction.date || new Date().toISOString().split('T')[0]
    };
    this.transactions.push(newTx);
    return newTx;
  },

  async getCashflowSummary(userId) {
    await new Promise(r => setTimeout(r, 300));
    const txs = this.transactions.filter(t => t.user_id === userId);
    const monthlyData = {};
    
    txs.forEach(tx => {
      const month = tx.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else {
        monthlyData[month].expenses += tx.amount;
      }
    });

    const summary = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      netCashflow: data.income - data.expenses
    }));

    const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const avgMonthlyIncome = summary.length > 0 ? totalIncome / summary.length : 0;
    const avgMonthlyExpenses = summary.length > 0 ? totalExpenses / summary.length : 0;

    return {
      monthlyData: summary,
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      avgMonthlyIncome,
      avgMonthlyExpenses
    };
  },

  async getEligibilityScore(userId) {
    await new Promise(r => setTimeout(r, 500));
    const summary = await this.getCashflowSummary(userId);
    
    const avgIncome = summary.avgMonthlyIncome;
    const incomeStability = summary.monthlyData.length > 3 ? 0.8 : 0.5;
    const expenseRatio = avgIncome > 0 ? summary.avgMonthlyExpenses / avgIncome : 1;
    const cashflowConsistency = summary.monthlyData.filter(m => m.netCashflow > 0).length / Math.max(summary.monthlyData.length, 1);

    let baseScore = 50;
    if (avgIncome > 50000) baseScore += 15;
    else if (avgIncome > 30000) baseScore += 10;
    else if (avgIncome > 20000) baseScore += 5;

    baseScore += incomeStability * 20;
    baseScore -= expenseRatio > 0.8 ? 15 : expenseRatio > 0.6 ? 10 : 5;
    baseScore += cashflowConsistency * 15;

    const score = Math.min(100, Math.max(0, baseScore));
    const riskLevel = score > 70 ? 'LOW' : score > 50 ? 'MEDIUM' : 'HIGH';

    const factors = [
      { factor: 'Average Monthly Income', impact: avgIncome > 30000 ? 'Positive' : 'Needs Improvement' },
      { factor: 'Income Stability', impact: incomeStability > 0.7 ? 'Strong' : 'Moderate' },
      { factor: 'Expense Control', impact: expenseRatio < 0.7 ? 'Good' : 'High' },
      { factor: 'Cashflow Consistency', impact: cashflowConsistency > 0.7 ? 'Excellent' : 'Variable' }
    ];

    return { eligibility_score: Math.round(score), risk_level: riskLevel, factors };
  },

  async getHealthScore(userId) {
    await new Promise(r => setTimeout(r, 500));
    const summary = await this.getCashflowSummary(userId);
    const eligibility = await this.getEligibilityScore(userId);

    const cashflowStability = summary.monthlyData.filter(m => m.netCashflow > 0).length / Math.max(summary.monthlyData.length, 1);
    const savingsRate = summary.avgMonthlyIncome > 0 ? 
      Math.max(0, (summary.avgMonthlyIncome - summary.avgMonthlyExpenses) / summary.avgMonthlyIncome) : 0;
    const debtToIncome = 0.2;

    let healthScore = 0;
    healthScore += cashflowStability * 30;
    healthScore += savingsRate * 25;
    healthScore += (1 - debtToIncome) * 20;
    healthScore += (eligibility.eligibility_score / 100) * 25;

    const category = healthScore > 75 ? 'Healthy' : healthScore > 60 ? 'Stable' : healthScore > 40 ? 'Needs Improvement' : 'At Risk';

    return {
      health_score: Math.round(healthScore),
      category,
      breakdown: {
        cashflow_stability: Math.round(cashflowStability * 100),
        savings_rate: Math.round(savingsRate * 100),
        debt_ratio: Math.round(debtToIncome * 100),
        eligibility: eligibility.eligibility_score
      }
    };
  },

  async getLoanRecommendations(userId, requestedAmount, tenure) {
    await new Promise(r => setTimeout(r, 500));
    const summary = await this.getCashflowSummary(userId);
    const health = await this.getHealthScore(userId);

    const avgIncome = summary.avgMonthlyIncome;
    const debtRatio = 0.2;

    const recommendations = this.loanProducts
      .filter(p => 
        requestedAmount >= p.min_amount &&
        requestedAmount <= p.max_amount &&
        tenure >= p.min_tenure &&
        tenure <= p.max_tenure &&
        avgIncome >= p.min_income &&
        debtRatio <= p.max_debt_ratio &&
        health.health_score >= p.min_health_score
      )
      .map(p => {
        const monthlyRate = p.interest_rate / 12 / 100;
        const emi = requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                    (Math.pow(1 + monthlyRate, tenure) - 1);
        const totalPayable = emi * tenure;
        const totalInterest = totalPayable - requestedAmount;
        const emiToIncome = avgIncome > 0 ? (emi / avgIncome) * 100 : 100;

        return {
          ...p,
          emi: Math.round(emi),
          total_interest: Math.round(totalInterest),
          total_payable: Math.round(totalPayable),
          emi_to_income_ratio: Math.round(emiToIncome),
          risk_note: emiToIncome > 40 ? 'High EMI burden' : emiToIncome > 30 ? 'Moderate burden' : 'Comfortable EMI'
        };
      })
      .sort((a, b) => a.interest_rate - b.interest_rate);

    return recommendations;
  },

  async chatbotMessage(userId, message) {
    await new Promise(r => setTimeout(r, 800));
    const summary = await this.getCashflowSummary(userId);
    const health = await this.getHealthScore(userId);
    const eligibility = await this.getEligibilityScore(userId);

    const msg = message.toLowerCase();
    let response = '';

    if (msg.includes('loan') && msg.includes('afford')) {
      const match = msg.match(/\d+/);
      if (match) {
        const amount = parseInt(match[0]);
        const maxEMI = summary.avgMonthlyIncome * 0.4;
        const assumedRate = 0.12 / 12;
        const tenure = 24;
        const emi = amount * assumedRate * Math.pow(1 + assumedRate, tenure) / 
                    (Math.pow(1 + assumedRate, tenure) - 1);
        
        if (emi <= maxEMI) {
          response = `Based on your average monthly income of ₹${Math.round(summary.avgMonthlyIncome)}, you can likely afford a loan of ₹${amount}. The estimated EMI would be around ₹${Math.round(emi)} for 24 months, which is within the recommended 40% of your income.`;
        } else {
          response = `A loan of ₹${amount} might be challenging. The estimated EMI of ₹${Math.round(emi)} exceeds 40% of your monthly income. Consider a smaller amount or longer tenure.`;
        }
      }
    } else if (msg.includes('improve') && msg.includes('score')) {
      const suggestions = [];
      if (health.health_score < 70) {
        if (health.breakdown.cashflow_stability < 70) suggestions.push('maintain consistent positive cashflow');
        if (health.breakdown.savings_rate < 20) suggestions.push('increase your savings rate by reducing expenses');
        if (eligibility.eligibility_score < 60) suggestions.push('build a stronger income history over time');
      }
      response = suggestions.length > 0 ?
        `To improve your score, focus on: ${suggestions.join(', ')}. Your current health score is ${health.health_score}/100.` :
        `Your score is already strong at ${health.health_score}/100! Keep maintaining healthy financial habits.`;
    } else if (msg.includes('eligibility')) {
      response = `Your current loan eligibility score is ${eligibility.eligibility_score}/100 with a ${eligibility.risk_level} risk level. This is based on your income stability, expense patterns, and cashflow consistency.`;
    } else {
      response = `I can help you with questions about loan affordability, improving your financial scores, EMI calculations, and eligibility. Your current financial health score is ${health.health_score}/100. What would you like to know?`;
    }

    return { response, timestamp: new Date().toISOString() };
  },

  async getRiskFlags() {
    await new Promise(r => setTimeout(r, 300));
    return this.riskFlags;
  },

  async analyzeRisk(userId) {
    await new Promise(r => setTimeout(r, 500));
    const txs = this.transactions.filter(t => t.user_id === userId);
    const recentTxs = txs.slice(-10);
    
    const flags = [];
    let riskLevel = 'LOW';

    const recentIncome = recentTxs.filter(t => t.type === 'income' && 
      new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const avgRecent = recentIncome.reduce((sum, t) => sum + t.amount, 0) / Math.max(recentIncome.length, 1);
    const avgOld = txs.filter(t => t.type === 'income').slice(0, -10)
      .reduce((sum, t) => sum + t.amount, 0) / Math.max(txs.length - 10, 1);

    if (avgRecent > avgOld * 2 && recentIncome.length > 0) {
      flags.push('Sudden income spike detected in last 7 days');
      riskLevel = 'MEDIUM';
    }

    const largeTxs = recentTxs.filter(t => t.amount > 100000);
    if (largeTxs.length > 3) {
      flags.push('Multiple large transactions in short period');
      riskLevel = 'MEDIUM';
    }

    if (flags.length > 1) riskLevel = 'HIGH';

    const flag = {
      id: this.riskFlags.length + 1,
      user_id: userId,
      risk_level: riskLevel,
      reasons: flags.length > 0 ? flags : ['No risk flags detected'],
      created_at: new Date().toISOString()
    };

    this.riskFlags.push(flag);
    return flag;
  }
};

// Initialize with demo data
if (mockAPI.users.length === 0) {
  mockAPI.users = [
    { id: 1, name: 'Demo Borrower', email: 'borrower@demo.com', role: 'BORROWER', business_name: 'Demo Store' },
    { id: 2, name: 'Admin User', email: 'admin@demo.com', role: 'ADMIN', business_name: 'FinBridge Admin' }
  ];

  const demoUserId = 1;
  const baseDate = new Date('2024-10-01');
  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    if (i % 7 === 0) {
      mockAPI.transactions.push({
        id: mockAPI.transactions.length + 1,
        user_id: demoUserId,
        date: dateStr,
        amount: 40000 + Math.random() * 20000,
        type: 'income',
        category: 'Sales Revenue',
        description: 'Weekly sales'
      });
    }

    if (i % 3 === 0) {
      mockAPI.transactions.push({
        id: mockAPI.transactions.length + 1,
        user_id: demoUserId,
        date: dateStr,
        amount: 3000 + Math.random() * 5000,
        type: 'expense',
        category: Math.random() > 0.5 ? 'Inventory' : 'Operating Costs',
        description: 'Business expense'
      });
    }
  }
}

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = async (email, password) => {
    const result = await mockAPI.login(email, password);
    if (result.success) {
      setUser(result.user);
      mockAPI.currentUser = result.user;
      setCurrentPage('home');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    mockAPI.currentUser = null;
    setCurrentPage('login');
  };

  const navigate = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8" />
              <span className="text-xl font-bold">FinBridge</span>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>

            <div className="hidden md:flex items-center space-x-1">
              <NavButton icon={<Home size={18} />} label="Home" onClick={() => navigate('home')} active={currentPage === 'home'} />
              <NavButton icon={<TrendingUp size={18} />} label="Cash Flow" onClick={() => navigate('cash-flow-dashboard')} active={currentPage === 'cash-flow-dashboard'} />
              <NavButton icon={<MessageSquare size={18} />} label="Chatbot" onClick={() => navigate('financial-advice-chatbot')} active={currentPage === 'financial-advice-chatbot'} />
              <NavButton icon={<FileText size={18} />} label="Eligibility" onClick={() => navigate('loan-eligibility')} active={currentPage === 'loan-eligibility'} />
              <NavButton icon={<DollarSign size={18} />} label="Health Score" onClick={() => navigate('financial-health-score')} active={currentPage === 'financial-health-score'} />
              <NavButton icon={<TrendingUp size={18} />} label="Loan Match" onClick={() => navigate('loan-matching')} active={currentPage === 'loan-matching'} />
              {user.role === 'ADMIN' && (
                <NavButton icon={<Shield size={18} />} label="Risk Monitor" onClick={() => navigate('fraud-risk-monitoring')} active={currentPage === 'fraud-risk-monitoring'} />
              )}
              <button onClick={handleLogout} className="ml-4 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg flex items-center space-x-2">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <MobileNavButton label="Home" onClick={() => navigate('home')} />
              <MobileNavButton label="Cash Flow" onClick={() => navigate('cash-flow-dashboard')} />
              <MobileNavButton label="Chatbot" onClick={() => navigate('financial-advice-chatbot')} />
              <MobileNavButton label="Eligibility" onClick={() => navigate('loan-eligibility')} />
              <MobileNavButton label="Health Score" onClick={() => navigate('financial-health-score')} />
              <MobileNavButton label="Loan Match" onClick={() => navigate('loan-matching')} />
              {user.role === 'ADMIN' && <MobileNavButton label="Risk Monitor" onClick={() => navigate('fraud-risk-monitoring')} />}
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-indigo-700 rounded">Logout</button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'home' && <HomePage user={user} navigate={navigate} />}
        {currentPage === 'cash-flow-dashboard' && <CashFlowDashboard user={user} />}
        {currentPage === 'financial-advice-chatbot' && <FinancialChatbot user={user} />}
        {currentPage === 'loan-eligibility' && <LoanEligibility user={user} />}
        {currentPage === 'financial-health-score' && <HealthScore user={user} />}
        {currentPage === 'loan-matching' && <LoanMatching user={user} />}
        {currentPage === 'fraud-risk-monitoring' && <RiskMonitoring user={user} />}
      </main>
    </div>
  );
};

const NavButton = ({ icon, label, onClick, active }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
      active ? 'bg-indigo-700' : 'hover:bg-indigo-700'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const MobileNavButton = ({ label, onClick }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-2 hover:bg-indigo-700 rounded">{label}</button>
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('borrower@demo.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError('Invalid credentials. Use: borrower@demo.com or admin@demo.com with password: password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <DollarSign className="w-12 h-12 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800 ml-3">FinBridge</h1>
        </div>
        <p className="text-center text-gray-600 mb-6">Microfinance Platform for Small Businesses</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-semibold mb-2">Demo Accounts:</p>
          <p>Borrower: borrower@demo.com</p>
          <p>Admin: admin@demo.com</p>
          <p className="mt-2">Password: password</p>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ user, navigate }) => {
  const features = [
    { title: 'Cash Flow Dashboard', icon: <TrendingUp size={32} />, desc: 'Track income, expenses and analyze trends', page: 'cash-flow-dashboard', color: 'bg-blue-500' },
    { title: 'Financial Chatbot', icon: <MessageSquare size={32} />, desc: 'Get personalized financial advice', page: 'financial-advice-chatbot', color: 'bg-green-500' },
    { title: 'Loan Eligibility', icon: <FileText size={32} />, desc: 'Check your loan eligibility score', page: 'loan-eligibility', color: 'bg-purple-500' },
    { title: 'Health Score', icon: <DollarSign size={32} />, desc: 'View your financial health rating', page: 'financial-health-score', color: 'bg-orange-500' },
    { title: 'Loan Matching', icon: <TrendingUp size={32} />, desc: 'Find best loan products for you', page: 'loan-matching', color: 'bg-pink-500' },
    { title: 'Risk Monitoring', icon: <Shield size={32} />, desc: 'Fraud detection and risk analysis', page: 'fraud-risk-monitoring', color: 'bg-red-500', adminOnly: true }
  ];

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user.name}!</h1>
        <p className="text-gray-600">{user.business_name || 'Your Business'} • {user.role}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features
          .filter(f => !f.adminOnly || user.role === 'ADMIN')
          .map((feature, idx) => (
            <button
              key={idx}
              onClick={() => navigate(feature.page)}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
            >
              <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </button>
          ))}
      </div>
    </div>
  );
};

// Component definitions continue...
const StatCard = ({ title, value, color }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-600 mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const CashFlowDashboard = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', type: 'income', category: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const txs = await mockAPI.getTransactions(user.id);
    const sum = await mockAPI.getCashflowSummary(user.id);
    setTransactions(txs.slice(-20));
    setSummary(sum);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await mockAPI.addTransaction({
      user_id: user.id,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description
    });
    setFormData({ amount: '', type: 'income', category: '', description: '' });
    setShowForm(false);
    loadData();
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Cash Flow Dashboard</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <input 
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input 
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input 
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            />
            <button type="submit" className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              Add Transaction
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Income" value={`₹${Math.round(summary.totalIncome).toLocaleString()}`} color="text-green-600" />
          <StatCard title="Total Expenses" value={`₹${Math.round(summary.totalExpenses).toLocaleString()}`} color="text-red-600" />
          <StatCard title="Net Cashflow" value={`₹${Math.round(summary.netCashflow).toLocaleString()}`} color={summary.netCashflow > 0 ? "text-green-600" : "text-red-600"} />
          <StatCard title="Avg Monthly Income" value={`₹${Math.round(summary.avgMonthlyIncome).toLocaleString()}`} color="text-blue-600" />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" />
              <Bar dataKey="expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Net Cashflow Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={summary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="netCashflow" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b">
                  <td className="px-4 py-2">{tx.date}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{tx.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{tx.description}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinancialChatbot = ({ user }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your financial advisor. Ask me about loan affordability, improving your scores, or EMI calculations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const response = await mockAPI.chatbotMessage(user.id, input);
    setMessages(prev => [...prev, { role: 'bot', text: response.response }]);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Advice Chatbot</h2>
      
      <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-block px-4 py-2 rounded-lg bg-white border">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about your finances..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">Try asking:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>"Can I afford a loan of 200000?"</li>
          <li>"How can I improve my score?"</li>
          <li>"Is my EMI too high?"</li>
          <li>"What's my eligibility score?"</li>
        </ul>
      </div>
    </div>
  );
};

const LoanEligibility = ({ user }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
  }, []);

  const loadScore = async () => {
    setLoading(true);
    const result = await mockAPI.getEligibilityScore(user.id);
    setScore(result);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  const scoreColor = score.risk_level === 'LOW' ? 'text-green-600' : score.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600';
  const bgColor = score.risk_level === 'LOW' ? 'bg-green-50' : score.risk_level === 'MEDIUM' ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Loan Eligibility Score</h2>
        
        <div className={`${bgColor} rounded-xl p-8 mb-6 text-center`}>
          <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
            {score.eligibility_score}
          </div>
          <div className="text-2xl text-gray-700">out of 100</div>
          <div className={`inline-block mt-4 px-6 py-2 rounded-full ${scoreColor} font-semibold`}>
            {score.risk_level} RISK
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Contributing Factors</h3>
          <div className="space-y-3">
            {score.factors.map((factor, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">{factor.factor}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  factor.impact.includes('Positive') || factor.impact.includes('Good') || factor.impact.includes('Strong') || factor.impact.includes('Excellent')
                    ? 'bg-green-100 text-green-800'
                    : factor.impact.includes('Moderate')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {factor.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-gray-700">
            Your eligibility score is calculated using ML algorithms based on income stability, expense patterns, and cashflow consistency. 
            Higher scores indicate better loan approval chances and lower interest rates.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Improve Your Score</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            Maintain consistent monthly income over time
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            Keep expenses below 70% of income
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            Build a positive cashflow history
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            Reduce existing debt obligations
          </li>
        </ul>
      </div>
    </div>
  );
};

const ScoreBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-indigo-600 h-2 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const HealthScore = ({ user }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    const result = await mockAPI.getHealthScore(user.id);
    setHealth(result);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  const categoryColor = {
    'Healthy': 'text-green-600 bg-green-50',
    'Stable': 'text-blue-600 bg-blue-50',
    'Needs Improvement': 'text-yellow-600 bg-yellow-50',
    'At Risk': 'text-red-600 bg-red-50'
  }[health.category];

  const chartData = [
    { name: 'Cashflow Stability', value: health.breakdown.cashflow_stability },
    { name: 'Savings Rate', value: health.breakdown.savings_rate },
    { name: 'Low Debt', value: 100 - health.breakdown.debt_ratio },
    { name: 'Eligibility', value: health.breakdown.eligibility }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Health Score</h2>
        
        <div className={`${categoryColor} rounded-xl p-8 mb-6 text-center`}>
          <div className="text-6xl font-bold mb-2">{health.health_score}</div>
          <div className="text-2xl">out of 100</div>
          <div className="inline-block mt-4 px-6 py-3 rounded-full text-xl font-semibold">
            {health.category}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              <ScoreBar label="Cashflow Stability" value={health.breakdown.cashflow_stability} />
              <ScoreBar label="Savings Rate" value={health.breakdown.savings_rate} />
              <ScoreBar label="Debt Management" value={100 - health.breakdown.debt_ratio} />
              <ScoreBar label="Loan Eligibility" value={health.breakdown.eligibility} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">What This Means</h3>
          <p className="text-sm text-gray-700">
            {health.category === 'Healthy' && "Excellent financial health! You're managing your finances well and are in a strong position for loans."}
            {health.category === 'Stable' && "Good financial health. You're on the right track. Consider improving savings to reach the 'Healthy' category."}
            {health.category === 'Needs Improvement' && "Your finances need attention. Focus on increasing income, reducing expenses, or managing debt better."}
            {health.category === 'At Risk' && "Critical attention needed. Your financial situation requires immediate improvement to qualify for loans."}
          </p>
        </div>
      </div>
    </div>
  );
};

const LoanMatching = ({ user }) => {
  const [amount, setAmount] = useState('100000');
  const [tenure, setTenure] = useState('24');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const results = await mockAPI.getLoanRecommendations(user.id, parseFloat(amount), parseInt(tenure));
    setRecommendations(results);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Loan Matching Engine</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (₹)</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="100000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tenure (months)</label>
            <input 
              type="number"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="24"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Loans'}
            </button>
          </div>
        </div>

        {searched && recommendations.length === 0 && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800">No matching loan products found. Try adjusting your amount or tenure, or work on improving your financial health score.</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommended Loans ({recommendations.length})</h3>
            {recommendations.map(loan => (
              <div key={loan.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{loan.lender_name}</h4>
                    <p className="text-sm text-gray-600">Interest Rate: {loan.interest_rate}% p.a.</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    loan.emi_to_income_ratio < 30 ? 'bg-green-100 text-green-800' :
                    loan.emi_to_income_ratio < 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {loan.risk_note}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="text-lg font-bold text-indigo-600">₹{loan.emi.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Interest</p>
                    <p className="text-lg font-bold">₹{loan.total_interest.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payable</p>
                    <p className="text-lg font-bold">₹{loan.total_payable.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">EMI/Income</p>
                    <p className="text-lg font-bold">{loan.emi_to_income_ratio}%</p>
                  </div>
                </div>

                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RiskMonitoring = ({ user }) => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    await mockAPI.analyzeRisk(1);
    const allFlags = await mockAPI.getRiskFlags();
    setFlags(allFlags);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Fraud & Risk Monitoring</h2>
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Flags" value={flags.length.toString()} color="text-gray-800" />
          <StatCard title="High Risk" value={flags.filter(f => f.risk_level === 'HIGH').length.toString()} color="text-red-600" />
          <StatCard title="Medium Risk" value={flags.filter(f => f.risk_level === 'MEDIUM').length.toString()} color="text-yellow-600" />
        </div>

        <div className="space-y-4">
          {flags.map(flag => (
            <div key={flag.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">User ID: {flag.user_id}</p>
                  <p className="text-sm text-gray-600">{new Date(flag.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  flag.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                  flag.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {flag.risk_level} RISK
                </span>
              </div>

              <div>
                <p className="font-semibold mb-2">Risk Indicators:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {flag.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;