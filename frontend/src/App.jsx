import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, MessageSquare, FileText, Shield, Menu, X, LogOut, Home, Plus, Search, ArrowUp, ArrowDown, CheckCircle, Clock, Sparkles, ChevronRight, Activity, Zap } from 'lucide-react';

// Mock API Service (unchanged for functionality)
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
      } else {
        response = `To check loan affordability, please specify an amount. For example: "Can I afford a loan of 200000?"`;
      }
    } 
    else if (msg.includes('improve') && msg.includes('score')) {
      const suggestions = [];
      if (health.health_score < 70) {
        if (health.breakdown.cashflow_stability < 70) suggestions.push('maintain consistent positive cashflow');
        if (health.breakdown.savings_rate < 20) suggestions.push('increase your savings rate by reducing expenses');
        if (eligibility.eligibility_score < 60) suggestions.push('build a stronger income history over time');
      }
      response = suggestions.length > 0 ?
        `To improve your score, focus on: ${suggestions.join(', ')}. Your current health score is ${health.health_score}/100.` :
        `Your score is already strong at ${health.health_score}/100! Keep maintaining healthy financial habits.`;
    } 
    else if (msg.includes('eligibility') || msg.includes('eligible')) {
      response = `Your current loan eligibility score is ${eligibility.eligibility_score}/100 with a ${eligibility.risk_level} risk level. This is based on your income stability, expense patterns, and cashflow consistency.`;
    }
    else if (msg.includes('income') || msg.includes('earning')) {
      response = `Your average monthly income is ₹${Math.round(summary.avgMonthlyIncome)}. Total income: ₹${Math.round(summary.totalIncome)}. This is calculated from your transaction history.`;
    }
    else if (msg.includes('expense') || msg.includes('spending')) {
      response = `Your average monthly expenses are ₹${Math.round(summary.avgMonthlyExpenses)}. Total expenses: ₹${Math.round(summary.totalExpenses)}. Your expense to income ratio is ${Math.round((summary.avgMonthlyExpenses / summary.avgMonthlyIncome) * 100)}%.`;
    }
    else if (msg.includes('saving') || msg.includes('save')) {
      const savings = summary.netCashflow;
      const savingsRate = summary.avgMonthlyIncome > 0 ? (savings / summary.totalIncome) * 100 : 0;
      response = `Your net savings are ₹${Math.round(savings)}. Your savings rate is ${Math.round(savingsRate)}%. ${savingsRate > 20 ? 'Great job!' : 'Try to save at least 20% of your income.'}`;
    }
    else if (msg.includes('emi') || msg.includes('installment')) {
      const match = msg.match(/\d+/);
      if (match) {
        const amount = parseInt(match[0]);
        const rate = 0.12 / 12;
        const tenure = 24;
        const emi = amount * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1);
        response = `For a loan of ₹${amount} at 12% interest for 24 months, your EMI would be approximately ₹${Math.round(emi)}. Total payable: ₹${Math.round(emi * tenure)}.`;
      } else {
        response = `To calculate EMI, please specify a loan amount. For example: "What's the EMI for 100000?"`;
      }
    }
    else if (msg.includes('health')) {
      response = `Your financial health score is ${health.health_score}/100 (${health.category}). Breakdown: Cashflow Stability ${health.breakdown.cashflow_stability}%, Savings Rate ${health.breakdown.savings_rate}%, Debt Management ${100 - health.breakdown.debt_ratio}%.`;
    }
    else if (msg.includes('loan') && (msg.includes('product') || msg.includes('option') || msg.includes('available'))) {
      response = `We have ${this.loanProducts.length} loan products available with interest rates from ${Math.min(...this.loanProducts.map(p => p.interest_rate))}% to ${Math.max(...this.loanProducts.map(p => p.interest_rate))}%. Visit the Loan Matching page to find the best options for you!`;
    }
    else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      response = `Hello! I'm your financial advisor. I can help you with loan affordability, EMI calculations, improving your scores, and understanding your financial health. What would you like to know?`;
    }
    else if (msg.includes('thank') || msg.includes('thanks')) {
      response = `You're welcome! Feel free to ask me anything about your finances anytime. I'm here to help!`;
    }
    else {
      response = `I can help you with:
• Loan affordability ("Can I afford a loan of 200000?")
• EMI calculations ("What's the EMI for 100000?")
• Score improvement tips ("How can I improve my score?")
• Income & expense analysis ("What's my income?")
• Savings advice ("How much am I saving?")
• Eligibility check ("What's my eligibility?")
• Financial health ("What's my health score?")

Your current health score is ${health.health_score}/100. What would you like to know?`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('home')}>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FinBridge</span>
                <div className="text-xs text-gray-500 -mt-1">Smart Microfinance</div>
              </div>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden md:flex items-center space-x-1">
              <NavButton icon={<Home size={18} />} label="Home" onClick={() => navigate('home')} active={currentPage === 'home'} />
              <NavButton icon={<Activity size={18} />} label="Cash Flow" onClick={() => navigate('cash-flow-dashboard')} active={currentPage === 'cash-flow-dashboard'} />
              <NavButton icon={<Sparkles size={18} />} label="AI Advisor" onClick={() => navigate('financial-advice-chatbot')} active={currentPage === 'financial-advice-chatbot'} />
              <NavButton icon={<FileText size={18} />} label="Eligibility" onClick={() => navigate('loan-eligibility')} active={currentPage === 'loan-eligibility'} />
              <NavButton icon={<Zap size={18} />} label="Health Score" onClick={() => navigate('financial-health-score')} active={currentPage === 'financial-health-score'} />
              <NavButton icon={<Search size={18} />} label="Loan Match" onClick={() => navigate('loan-matching')} active={currentPage === 'loan-matching'} />
              {user.role === 'ADMIN' && (
                <NavButton icon={<Shield size={18} />} label="Risk Monitor" onClick={() => navigate('fraud-risk-monitoring')} active={currentPage === 'fraud-risk-monitoring'} />
              )}
              <button onClick={handleLogout} className="ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg">
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t">
              <MobileNavButton icon={<Home size={18} />} label="Home" onClick={() => navigate('home')} />
              <MobileNavButton icon={<Activity size={18} />} label="Cash Flow" onClick={() => navigate('cash-flow-dashboard')} />
              <MobileNavButton icon={<Sparkles size={18} />} label="AI Advisor" onClick={() => navigate('financial-advice-chatbot')} />
              <MobileNavButton icon={<FileText size={18} />} label="Eligibility" onClick={() => navigate('loan-eligibility')} />
              <MobileNavButton icon={<Zap size={18} />} label="Health Score" onClick={() => navigate('financial-health-score')} />
              <MobileNavButton icon={<Search size={18} />} label="Loan Match" onClick={() => navigate('loan-matching')} />
              {user.role === 'ADMIN' && <MobileNavButton icon={<Shield size={18} />} label="Risk Monitor" onClick={() => navigate('fraud-risk-monitoring')} />}
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center space-x-2">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all font-medium ${
      active 
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const MobileNavButton = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-lg flex items-center space-x-3 text-gray-700 transition-colors">
    {icon}
    <span>{label}</span>
  </button>
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('borrower@demo.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await onLogin(email, password);
    if (!success) {
      setError('Invalid credentials. Use demo accounts below.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
            <DollarSign className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Welcome to FinBridge</h1>
        <p className="text-center text-gray-600 mb-8">Smart Microfinance Platform for Growing Businesses</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
          <p className="font-bold mb-3 text-gray-800 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
            Demo Accounts
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Borrower:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">borrower@demo.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Admin:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">admin@demo.com</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Password:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">password</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ user, navigate }) => {
  const features = [
    { 
      title: 'Cash Flow Analytics', 
      icon: <Activity size={32} />, 
      desc: 'Real-time income & expense tracking with AI insights', 
      page: 'cash-flow-dashboard', 
      gradient: 'from-blue-500 to-cyan-500',
      stats: '90+ transactions'
    },
    { 
      title: 'AI Financial Advisor', 
      icon: <Sparkles size={32} />, 
      desc: 'Get personalized recommendations powered by ML', 
      page: 'financial-advice-chatbot', 
      gradient: 'from-green-500 to-emerald-500',
      stats: '24/7 available'
    },
    { 
      title: 'Loan Eligibility Check', 
      icon: <FileText size={32} />, 
      desc: 'Instant eligibility scoring with detailed breakdown', 
      page: 'loan-eligibility', 
      gradient: 'from-purple-500 to-pink-500',
      stats: 'ML-powered'
    },
    { 
      title: 'Financial Health Score', 
      icon: <Zap size={32} />, 
      desc: 'Comprehensive financial wellness assessment', 
      page: 'financial-health-score', 
      gradient: 'from-orange-500 to-red-500',
      stats: '4 key metrics'
    },
    { 
      title: 'Smart Loan Matching', 
      icon: <Search size={32} />, 
      desc: 'Find the perfect loan from 5+ verified lenders', 
      page: 'loan-matching', 
      gradient: 'from-pink-500 to-rose-500',
      stats: 'Best rates'
    },
    { 
      title: 'Risk Intelligence', 
      icon: <Shield size={32} />, 
      desc: 'Advanced fraud detection & risk monitoring', 
      page: 'fraud-risk-monitoring', 
      gradient: 'from-red-500 to-orange-500', 
      adminOnly: true,
      stats: 'Real-time alerts'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-300" />
            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Account Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome back, {user.name}! 👋</h1>
          <p className="text-xl text-white/90 mb-6">{user.business_name || 'Your Business'} • {user.role}</p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('cash-flow-dashboard')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-all border border-white/30 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Transaction</span>
            </button>
            <button 
              onClick={() => navigate('loan-matching')}
              className="bg-white hover:bg-gray-100 text-indigo-600 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2"
            >
              <Search size={20} />
              <span>Find Loans</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-indigo-600" />
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features
            .filter(f => !f.adminOnly || user.role === 'ADMIN')
            .map((feature, idx) => (
              <button
                key={idx}
                onClick={() => navigate(feature.page)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 text-left group border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-br ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-gray-600 mb-3 text-sm">{feature.desc}</p>
                <div className="flex items-center text-xs text-indigo-600 font-semibold">
                  <Activity className="w-4 h-4 mr-1" />
                  {feature.stats}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsSection user={user} navigate={navigate} />
    </div>
  );
};

const QuickStatsSection = ({ user, navigate }) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const summary = await mockAPI.getCashflowSummary(user.id);
      const health = await mockAPI.getHealthScore(user.id);
      const eligibility = await mockAPI.getEligibilityScore(user.id);
      setStats({ summary, health, eligibility });
    };
    loadStats();
  }, [user.id]);

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
        Your Financial Snapshot
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Net Cashflow</span>
            <ArrowUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">₹{Math.round(stats.summary.netCashflow).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Health Score</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.health.health_score}/100</p>
          <p className="text-xs text-gray-500 mt-1">{stats.health.category}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Eligibility</span>
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.eligibility.eligibility_score}/100</p>
          <p className="text-xs text-gray-500 mt-1">{stats.eligibility.risk_level} Risk</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Income</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">₹{Math.round(stats.summary.avgMonthlyIncome).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Per month</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, trend }) => (
  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all">
    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
    <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
    {trend && (
      <div className="flex items-center text-xs text-gray-500">
        {trend > 0 ? <ArrowUp className="w-3 h-3 text-green-500 mr-1" /> : <ArrowDown className="w-3 h-3 text-red-500 mr-1" />}
        <span>{Math.abs(trend)}% vs last month</span>
      </div>
    )}
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cash Flow Analytics</h2>
            <p className="text-gray-600 mt-1">Track your income and expenses in real-time</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2 ${
              showForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showForm ? 'Cancel' : 'Add Transaction'}</span>
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-indigo-600" />
              New Transaction
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="10000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <input 
                  type="text"
                  placeholder="Sales, Rent, etc."
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input 
                  type="text"
                  placeholder="Transaction details"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                />
              </div>
              <button type="submit" className="md:col-span-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                Add Transaction
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Income" value={`₹${Math.round(summary.totalIncome).toLocaleString()}`} color="text-green-600" trend={12} />
          <StatCard title="Total Expenses" value={`₹${Math.round(summary.totalExpenses).toLocaleString()}`} color="text-red-600" trend={-5} />
          <StatCard title="Net Cashflow" value={`₹${Math.round(summary.netCashflow).toLocaleString()}`} color={summary.netCashflow > 0 ? "text-green-600" : "text-red-600"} trend={8} />
          <StatCard title="Avg Monthly Income" value={`₹${Math.round(summary.avgMonthlyIncome).toLocaleString()}`} color="text-indigo-600" trend={15} />
        </div>

        <div className="mb-6 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            Income vs Expenses Trend
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={summary.monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Net Cashflow Analysis
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={summary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="netCashflow" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-600" />
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Description</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={tx.id} className={`border-b hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-4 text-sm text-gray-700">{tx.date}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type === 'income' ? '💰 Income' : '💸 Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-800">{tx.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{tx.description}</td>
                  <td className={`px-4 py-4 text-right font-bold text-lg ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
    { role: 'bot', text: '👋 Hello! I\'m your AI financial advisor powered by machine learning. Ask me about loan affordability, improving your scores, EMI calculations, or any financial questions!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "Can I afford a loan of 200000?",
    "How can I improve my score?",
    "What's my health score?",
    "Calculate EMI for 150000"
  ];

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
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl p-8 mb-6 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">AI Financial Advisor</h2>
            <p className="text-white/80">Powered by Machine Learning</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
          <h3 className="font-bold text-gray-800">Chat History</h3>
        </div>
        
        <div className="h-96 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block max-w-md px-5 py-3 rounded-2xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                  : 'bg-white border-2 border-gray-200 text-gray-800'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <div className={`text-xs text-gray-500 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? 'You' : 'AI Advisor'}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <div className="inline-block px-5 py-3 rounded-2xl bg-white border-2 border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <div className="flex space-x-2 mb-3">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your finances..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-gray-800 mb-2">Quick Tips:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>💰 Ask about loan affordability with specific amounts</li>
              <li>📊 Get insights on improving your financial scores</li>
              <li>🧮 Calculate EMI for different loan amounts</li>
              <li>💡 Get personalized advice based on your transaction history</li>
            </ul>
          </div>
        </div>
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const scoreColor = score.risk_level === 'LOW' ? 'text-green-600' : score.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600';
  const bgGradient = score.risk_level === 'LOW' ? 'from-green-50 to-emerald-50' : score.risk_level === 'MEDIUM' ? 'from-yellow-50 to-orange-50' : 'from-red-50 to-pink-50';
  const borderColor = score.risk_level === 'LOW' ? 'border-green-200' : score.risk_level === 'MEDIUM' ? 'border-yellow-200' : 'border-red-200';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Loan Eligibility Score</h2>
            <p className="text-gray-600 mt-1">ML-powered assessment of your loan readiness</p>
          </div>
          <FileText className="w-12 h-12 text-indigo-600" />
        </div>
        
        <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-12 mb-8 text-center border-2 ${borderColor} shadow-lg`}>
          <div className={`text-7xl font-black ${scoreColor} mb-4`}>
            {score.eligibility_score}
          </div>
          <div className="text-3xl text-gray-700 font-semibold mb-4">out of 100</div>
          <div className={`inline-block px-8 py-3 rounded-full ${scoreColor} font-bold text-lg shadow-md`}>
            {score.risk_level} RISK
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
            Key Factors Analysis
          </h3>
          <div className="space-y-4">
            {score.factors.map((factor, idx) => (
              <div key={idx} className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{factor.factor}</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    factor.impact.includes('Positive') || factor.impact.includes('Good') || factor.impact.includes('Strong') || factor.impact.includes('Excellent')
                      ? 'bg-green-100 text-green-700'
                      : factor.impact.includes('Moderate')
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {factor.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-6 rounded-xl">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-gray-800 mb-2">About Your Score</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Your eligibility score is calculated using advanced ML algorithms that analyze income stability, expense patterns, and cashflow consistency. 
                Higher scores indicate better loan approval chances and access to lower interest rates from our partner lenders.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
          How to Improve Your Score
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '💰', title: 'Maintain Consistent Income', desc: 'Regular income over 6+ months builds trust' },
            { icon: '📊', title: 'Control Expenses', desc: 'Keep expenses below 70% of monthly income' },
            { icon: '💚', title: 'Positive Cashflow', desc: 'Build a history of positive monthly cashflow' },
            { icon: '📉', title: 'Reduce Debt', desc: 'Lower existing debt obligations improves score' }
          ].map((tip, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{tip.icon}</div>
              <h4 className="font-bold text-gray-800 mb-1">{tip.title}</h4>
              <p className="text-sm text-gray-600">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScoreBar = ({ label, value }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className="text-sm font-bold text-indigo-600">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-1000 shadow-md"
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const categoryStyles = {
    'Healthy': { text: 'text-green-600', bg: 'from-green-50 to-emerald-50', border: 'border-green-200' },
    'Stable': { text: 'text-blue-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200' },
    'Needs Improvement': { text: 'text-yellow-600', bg: 'from-yellow-50 to-orange-50', border: 'border-yellow-200' },
    'At Risk': { text: 'text-red-600', bg: 'from-red-50 to-pink-50', border: 'border-red-200' }
  }[health.category];

  const chartData = [
    { name: 'Cashflow Stability', value: health.breakdown.cashflow_stability },
    { name: 'Savings Rate', value: health.breakdown.savings_rate },
    { name: 'Low Debt', value: 100 - health.breakdown.debt_ratio },
    { name: 'Eligibility', value: health.breakdown.eligibility }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Financial Health Score</h2>
            <p className="text-gray-600 mt-1">Comprehensive wellness assessment of your finances</p>
          </div>
          <Zap className="w-12 h-12 text-indigo-600" />
        </div>
        
        <div className={`bg-gradient-to-br ${categoryStyles.bg} rounded-2xl p-12 mb-8 text-center border-2 ${categoryStyles.border} shadow-lg`}>
          <div className={`text-7xl font-black ${categoryStyles.text} mb-4`}>{health.health_score}</div>
          <div className="text-3xl text-gray-700 font-semibold mb-4">out of 100</div>
          <div className={`inline-block px-8 py-3 rounded-full text-xl font-bold ${categoryStyles.text} shadow-md`}>
            {health.category}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-indigo-600" />
              Score Breakdown
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
              <ScoreBar label="Cashflow Stability" value={health.breakdown.cashflow_stability} />
              <ScoreBar label="Savings Rate" value={health.breakdown.savings_rate} />
              <ScoreBar label="Debt Management" value={100 - health.breakdown.debt_ratio} />
              <ScoreBar label="Loan Eligibility" value={health.breakdown.eligibility} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
              Score Distribution
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value}%`}
                    outerRadius={90}
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
              <div className="grid grid-cols-2 gap-2 mt-4">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
            What This Means for You
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {health.category === 'Healthy' && "🎉 Excellent financial health! You're managing your finances exceptionally well and are in a strong position for loan approvals with favorable terms."}
            {health.category === 'Stable' && "👍 Good financial health. You're on the right track. Consider improving savings to reach the 'Healthy' category and unlock even better loan terms."}
            {health.category === 'Needs Improvement' && "⚠️ Your finances need attention. Focus on increasing income, reducing expenses, or managing debt better to improve your loan prospects."}
            {health.category === 'At Risk' && "🚨 Critical attention needed. Your financial situation requires immediate improvement to qualify for loans. Consult with our AI advisor for personalized guidance."}
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
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Smart Loan Matching</h2>
            <p className="text-gray-600 mt-1">Find the perfect loan from verified lenders</p>
          </div>
          <Search className="w-12 h-12 text-indigo-600" />
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-indigo-600" />
            Loan Requirements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Amount (₹)</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure (months)</label>
              <input 
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                placeholder="24"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Find Loans</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {searched && recommendations.length === 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Matches Found</h3>
            <p className="text-gray-700 mb-4">We couldn't find any loan products matching your requirements. Try adjusting your amount or tenure, or work on improving your financial health score.</p>
            <button 
              onClick={() => setSearched(false)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                {recommendations.length} Matching Loans
              </h3>
              <span className="text-sm text-gray-600">Sorted by interest rate</span>
            </div>
            {recommendations.map((loan, idx) => (
              <div key={loan.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-indigo-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {idx === 0 && <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">BEST RATE</span>}
                      <h4 className="text-2xl font-bold text-gray-800">{loan.lender_name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Interest Rate: <span className="font-bold text-indigo-600 ml-1">{loan.interest_rate}% p.a.</span>
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    loan.emi_to_income_ratio < 30 ? 'bg-green-100 text-green-700' :
                    loan.emi_to_income_ratio < 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {loan.risk_note}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Monthly EMI</p>
                    <p className="text-xl font-bold text-indigo-600">₹{loan.emi.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Total Interest</p>
                    <p className="text-xl font-bold text-gray-800">₹{loan.total_interest.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Total Payable</p>
                    <p className="text-xl font-bold text-gray-800">₹{loan.total_payable.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-semibold">EMI/Income</p>
                    <p className="text-xl font-bold text-purple-600">{loan.emi_to_income_ratio}%</p>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Apply Now</span>
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Risk Intelligence Center</h2>
            <p className="text-gray-600 mt-1">Advanced fraud detection & monitoring</p>
          </div>
          <Shield className="w-12 h-12 text-red-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Total Flags</span>
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-4xl font-bold text-gray-800">{flags.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border-2 border-red-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-600">High Risk</span>
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600">{flags.filter(f => f.risk_level === 'HIGH').length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-600">Medium Risk</span>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-4xl font-bold text-yellow-600">{flags.filter(f => f.risk_level === 'MEDIUM').length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <Activity className="w-6 h-6 mr-2 text-red-600" />
            Risk Alerts
          </h3>
          {flags.map(flag => (
            <div key={flag.id} className="bg-gradient-to-br from-white to-gray-50 border-2 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-bold text-gray-800">User ID: {flag.user_id}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{flag.id}</span>
                  </div>
                  <p className="text-sm text-gray-600">{new Date(flag.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-5 py-2 rounded-full font-bold shadow-md ${
                  flag.risk_level === 'HIGH' ? 'bg-red-100 text-red-700 border-2 border-red-200' :
                  flag.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' :
                  'bg-green-100 text-green-700 border-2 border-green-200'
                }`}>
                  {flag.risk_level} RISK
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="font-bold mb-2 text-gray-800 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                  Risk Indicators:
                </p>
                <ul className="space-y-1">
                  {flag.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      {reason}
                    </li>
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