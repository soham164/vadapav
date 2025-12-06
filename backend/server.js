// backend/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finbridge',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'BORROWER', business_name, sector, location } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, password_hash, role]
    );

    const user = userResult.rows[0];

    // Insert business profile if borrower
    if (role === 'BORROWER') {
      await pool.query(
        'INSERT INTO business_profiles (user_id, business_name, sector, location) VALUES ($1, $2, $3, $4)',
        [user.id, business_name || `${name}'s Business`, sector, location]
      );
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============= TRANSACTION ROUTES =============

// Get transactions for user
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { date, amount, type, category, description } = req.body;
    
    const result = await pool.query(
      'INSERT INTO transactions (user_id, date, amount, type, category, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, date || new Date().toISOString().split('T')[0], amount, type, category, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Bulk upload transactions (CSV)
app.post('/api/transactions/bulk', authenticateToken, async (req, res) => {
  try {
    const { transactions } = req.body; // Array of {date, amount, type, category, description}
    
    const insertPromises = transactions.map(tx => 
      pool.query(
        'INSERT INTO transactions (user_id, date, amount, type, category, description) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, tx.date, tx.amount, tx.type, tx.category || 'General', tx.description || '']
      )
    );

    await Promise.all(insertPromises);
    res.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to upload transactions' });
  }
});

// ============= CASHFLOW ROUTES =============

// Get cashflow summary
app.get('/api/cashflow/summary', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date',
      [req.user.id]
    );

    const transactions = result.rows;
    const monthlyData = {};

    transactions.forEach(tx => {
      const month = tx.date.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += parseFloat(tx.amount);
      } else {
        monthlyData[month].expenses += parseFloat(tx.amount);
      }
    });

    const summary = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      netCashflow: data.income - data.expenses
    }));

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const avgMonthlyIncome = summary.length > 0 ? totalIncome / summary.length : 0;
    const avgMonthlyExpenses = summary.length > 0 ? totalExpenses / summary.length : 0;

    res.json({
      monthlyData: summary,
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      avgMonthlyIncome,
      avgMonthlyExpenses
    });
  } catch (error) {
    console.error('Cashflow summary error:', error);
    res.status(500).json({ error: 'Failed to generate cashflow summary' });
  }
});

// ============= ML ROUTES =============

// Get eligibility score
app.get('/api/ml/eligibility-score', authenticateToken, async (req, res) => {
  try {
    // Call Python ML service
    const { stdout } = await execPromise(
      `python3 ml/inference.py eligibility ${req.user.id}`,
      { cwd: __dirname + '/..' }
    );

    const result = JSON.parse(stdout);
    
    // Save to database
    await pool.query(
      'INSERT INTO model_scores (user_id, eligibility_score, risk_level) VALUES ($1, $2, $3)',
      [req.user.id, result.eligibility_score, result.risk_level]
    );

    res.json(result);
  } catch (error) {
    console.error('Eligibility score error:', error);
    res.status(500).json({ error: 'Failed to calculate eligibility score' });
  }
});

// Get health score
app.get('/api/ml/health-score', authenticateToken, async (req, res) => {
  try {
    const { stdout } = await execPromise(
      `python3 ml/inference.py health ${req.user.id}`,
      { cwd: __dirname + '/..' }
    );

    const result = JSON.parse(stdout);
    
    await pool.query(
      'UPDATE model_scores SET health_score = $1 WHERE user_id = $2',
      [result.health_score, req.user.id]
    );

    res.json(result);
  } catch (error) {
    console.error('Health score error:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// ============= LOAN PRODUCT ROUTES =============

// Get all loan products
app.get('/api/loan-products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loan_products ORDER BY interest_rate');
    res.json(result.rows);
  } catch (error) {
    console.error('Get loan products error:', error);
    res.status(500).json({ error: 'Failed to fetch loan products' });
  }
});

// ============= LOAN APPLICATION ROUTES =============

// Get user's loan applications
app.get('/api/loan-applications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, lp.lender_name, lp.interest_rate 
       FROM loan_applications la 
       JOIN loan_products lp ON la.loan_product_id = lp.id 
       WHERE la.user_id = $1 
       ORDER BY la.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get loan applications error:', error);
    res.status(500).json({ error: 'Failed to fetch loan applications' });
  }
});

// Create loan application
app.post('/api/loan-applications', authenticateToken, async (req, res) => {
  try {
    const { loan_product_id, requested_amount, tenure } = req.body;
    
    const result = await pool.query(
      'INSERT INTO loan_applications (user_id, loan_product_id, requested_amount, tenure, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, loan_product_id, requested_amount, tenure, 'PENDING']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create loan application error:', error);
    res.status(500).json({ error: 'Failed to create loan application' });
  }
});

// ============= LOAN MATCHING ROUTES =============

// Get loan recommendations
app.post('/api/loan-matching/recommendations', authenticateToken, async (req, res) => {
  try {
    const { requested_amount, tenure } = req.body;

    // Get user's financial data
    const cashflowRes = await pool.query(
      'SELECT AVG(CASE WHEN type = \'income\' THEN amount ELSE 0 END) as avg_income FROM transactions WHERE user_id = $1',
      [req.user.id]
    );

    const scoresRes = await pool.query(
      'SELECT * FROM model_scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    const avgIncome = parseFloat(cashflowRes.rows[0]?.avg_income) || 0;
    const healthScore = scoresRes.rows[0]?.health_score || 0;
    const debtRatio = 0.2; // Simplified

    // Get matching loan products
    const productsRes = await pool.query(
      `SELECT * FROM loan_products 
       WHERE $1 >= min_amount AND $1 <= max_amount 
       AND $2 >= min_tenure AND $2 <= max_tenure 
       AND $3 >= constraints->>'min_income' 
       AND $4 <= (constraints->>'max_debt_ratio')::float 
       AND $5 >= (constraints->>'min_health_score')::int
       ORDER BY interest_rate`,
      [requested_amount, tenure, avgIncome, debtRatio, healthScore]
    );

    // Calculate EMI for each product
    const recommendations = productsRes.rows.map(product => {
      const monthlyRate = product.interest_rate / 12 / 100;
      const emi = requested_amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                  (Math.pow(1 + monthlyRate, tenure) - 1);
      const totalPayable = emi * tenure;
      const totalInterest = totalPayable - requested_amount;
      const emiToIncomeRatio = avgIncome > 0 ? (emi / avgIncome) * 100 : 100;

      return {
        ...product,
        emi: Math.round(emi),
        total_interest: Math.round(totalInterest),
        total_payable: Math.round(totalPayable),
        emi_to_income_ratio: Math.round(emiToIncomeRatio),
        risk_note: emiToIncomeRatio > 40 ? 'High EMI burden' : 
                   emiToIncomeRatio > 30 ? 'Moderate burden' : 'Comfortable EMI'
      };
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Loan matching error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ============= CHATBOT ROUTES =============

// Chatbot message
app.post('/api/chatbot/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    // Get user context
    const cashflowRes = await pool.query(
      'SELECT AVG(CASE WHEN type = \'income\' THEN amount ELSE 0 END) as avg_income FROM transactions WHERE user_id = $1',
      [req.user.id]
    );

    const scoresRes = await pool.query(
      'SELECT * FROM model_scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    const avgIncome = parseFloat(cashflowRes.rows[0]?.avg_income) || 0;
    const healthScore = scoresRes.rows[0]?.health_score || 50;
    const eligibilityScore = scoresRes.rows[0]?.eligibility_score || 50;

    // Rule-based chatbot logic
    const msg = message.toLowerCase();
    let response = '';

    if (msg.includes('loan') && msg.includes('afford')) {
      const match = msg.match(/\d+/);
      if (match) {
        const amount = parseInt(match[0]);
        const maxEMI = avgIncome * 0.4;
        const emi = amount * 0.01 * 24; // Simplified
        
        response = emi <= maxEMI ?
          `Based on your income of ₹${Math.round(avgIncome)}, you can afford a loan of ₹${amount}. EMI: ~₹${Math.round(emi)}.` :
          `A loan of ₹${amount} might be challenging with your current income of ₹${Math.round(avgIncome)}.`;
      }
    } else if (msg.includes('improve') && msg.includes('score')) {
      response = healthScore < 70 ?
        `To improve your score (current: ${healthScore}/100), focus on: maintaining consistent cashflow, increasing savings, and reducing debt.` :
        `Your score is strong at ${healthScore}/100! Keep maintaining healthy habits.`;
    } else if (msg.includes('eligibility')) {
      response = `Your loan eligibility score is ${eligibilityScore}/100 with ${scoresRes.rows[0]?.risk_level || 'MEDIUM'} risk level.`;
    } else {
      response = `I can help with loan affordability, score improvement, and eligibility questions. Your health score: ${healthScore}/100.`;
    }

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Chatbot service unavailable' });
  }
});

// ============= FRAUD/RISK ROUTES =============

// Get risk flags (admin only)
app.get('/api/fraud/flags', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'SELECT * FROM risk_flags ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get risk flags error:', error);
    res.status(500).json({ error: 'Failed to fetch risk flags' });
  }
});

// Analyze risk for user
app.post('/api/fraud/analyze/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.userId;
    const txRes = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 30',
      [userId]
    );

    const transactions = txRes.rows;
    const flags = [];
    let riskLevel = 'LOW';

    // Check for sudden income spike
    const recentIncome = transactions
      .filter(t => t.type === 'income' && 
        new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const oldIncome = transactions
      .filter(t => t.type === 'income' && 
        new Date(t.date) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (recentIncome > oldIncome * 2 && recentIncome > 0) {
      flags.push('Sudden income spike in last 7 days');
      riskLevel = 'MEDIUM';
    }

    // Check for multiple large transactions
    const largeTxs = transactions.filter(t => parseFloat(t.amount) > 100000);
    if (largeTxs.length > 5) {
      flags.push('Multiple large transactions detected');
      riskLevel = 'HIGH';
    }

    if (flags.length === 0) {
      flags.push('No risk indicators detected');
    }

    // Save flag
    const result = await pool.query(
      'INSERT INTO risk_flags (user_id, risk_level, reasons) VALUES ($1, $2, $3) RETURNING *',
      [userId, riskLevel, JSON.stringify(flags)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze risk' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ FinBridge Backend running on port ${PORT}`);
});

module.exports = app;