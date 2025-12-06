# 🔐 Authentication & User Management Guide

## Current Setup

### Frontend (Mock API)
Currently, the frontend uses a **mock API** that only accepts:
- Email: `borrower@demo.com` or `admin@demo.com`
- Password: `password` (hardcoded)

### Backend (Real API)
The backend has **proper authentication** with:
- Bcrypt password hashing
- JWT token generation
- Database user validation
- Support for multiple users with different passwords

## Problem: Frontend Not Connected to Backend

The frontend is using mock data instead of calling the real backend API.

## Solution: Connect Frontend to Backend

### Option 1: Quick Fix - Update Demo User Passwords in Database

The database has demo users with hashed passwords. Let's verify and update them:

```sql
-- Connect to database
psql -U postgres -d finbridge

-- Check current users
SELECT id, name, email, role FROM users;

-- The passwords in the database are already hashed
-- To create a new user with a specific password, use the backend API
```

### Option 2: Use Backend API for Authentication (Recommended)

Update the frontend to use real API calls instead of mock API.

#### Step 1: Create API Service File

Create `frontend/src/services/api.js`:

```javascript
const API_BASE = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API call helper
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
};

// Authentication
export const login = async (email, password) => {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

export const register = async (userData) => {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Transactions
export const getTransactions = () => apiCall('/transactions');
export const addTransaction = (transaction) => apiCall('/transactions', {
  method: 'POST',
  body: JSON.stringify(transaction),
});

// Cashflow
export const getCashflowSummary = () => apiCall('/cashflow/summary');

// ML Services
export const getEligibilityScore = () => apiCall('/ml/eligibility-score');
export const getHealthScore = () => apiCall('/ml/health-score');

// Loan Products
export const getLoanProducts = () => apiCall('/loan-products');
export const getLoanApplications = () => apiCall('/loan-applications');
export const createLoanApplication = (application) => apiCall('/loan-applications', {
  method: 'POST',
  body: JSON.stringify(application),
});

// Loan Matching
export const getLoanRecommendations = (amount, tenure) => apiCall('/loan-matching/recommendations', {
  method: 'POST',
  body: JSON.stringify({ requested_amount: amount, tenure }),
});

// Chatbot
export const sendChatMessage = (message) => apiCall('/chatbot/message', {
  method: 'POST',
  body: JSON.stringify({ message }),
});

// Risk Monitoring (Admin)
export const getRiskFlags = () => apiCall('/fraud/flags');
export const analyzeRisk = (userId) => apiCall(`/fraud/analyze/${userId}`, {
  method: 'POST',
});
```

#### Step 2: Update App.jsx to Use Real API

Replace the mock API calls with real API calls in your components.

## How to Register New Users

### Method 1: Using Backend API Directly

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "BORROWER",
    "business_name": "John's Store",
    "sector": "Retail",
    "location": "Mumbai"
  }'
```

### Method 2: Using Postman or Thunder Client

1. Open Postman/Thunder Client
2. Create POST request to `http://localhost:5000/api/auth/register`
3. Set Headers: `Content-Type: application/json`
4. Set Body (JSON):
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "mypassword456",
  "role": "BORROWER",
  "business_name": "Jane's Boutique",
  "sector": "Fashion",
  "location": "Delhi"
}
```

### Method 3: Using Database Directly

```sql
-- Connect to database
psql -U postgres -d finbridge

-- Create password hash (you need to do this in Node.js)
-- In Node.js console or create a script:
```

Create `scripts/create-user.js`:
```javascript
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finbridge',
  password: 'password',
  port: 5432,
});

async function createUser(name, email, password, role = 'BORROWER') {
  try {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, password_hash, role]
    );
    
    console.log('User created:', result.rows[0]);
    
    // Create business profile
    if (role === 'BORROWER') {
      await pool.query(
        'INSERT INTO business_profiles (user_id, business_name, sector, location) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, `${name}'s Business`, 'General', 'India']
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Usage
createUser('Alice Johnson', 'alice@example.com', 'alice123', 'BORROWER');
```

Run it:
```bash
cd backend
node ../scripts/create-user.js
```

## Testing Different Users

### Test User 1 (Borrower)
```
Email: borrower@demo.com
Password: password
```

### Test User 2 (Admin)
```
Email: admin@demo.com
Password: password
```

### Create Your Own User
```bash
# Using the backend API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "yourpassword",
    "role": "BORROWER"
  }'
```

## Login with Different Users

### Using Backend API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

Response:
```json
{
  "user": {
    "id": 3,
    "name": "Your Name",
    "email": "your@email.com",
    "role": "BORROWER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Password Security

### Current Implementation
✅ Passwords are hashed using bcrypt (10 rounds)
✅ Passwords are never stored in plain text
✅ JWT tokens expire after 7 days
✅ Tokens are validated on protected routes

### Best Practices
1. **Never share passwords** - Each user should have unique credentials
2. **Use strong passwords** - Minimum 8 characters, mix of letters, numbers, symbols
3. **Change default passwords** - Update demo account passwords in production
4. **Secure JWT_SECRET** - Change the default secret in `.env`
5. **Use HTTPS** - In production, always use HTTPS

## Changing Passwords

### Method 1: Create Password Reset Endpoint

Add to `backend/server.js`:
```javascript
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Get user
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    
    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid old password' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});
```

### Method 2: Direct Database Update

```javascript
// Create script: scripts/reset-password.js
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finbridge',
  password: 'password',
  port: 5432,
});

async function resetPassword(email, newPassword) {
  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [password_hash, email]);
    console.log('Password reset successfully for:', email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Usage
resetPassword('borrower@demo.com', 'newpassword123');
```

## Summary

1. **Backend is ready** - Supports multiple users with different passwords
2. **Frontend uses mock data** - Need to connect to real backend API
3. **Create new users** - Use registration API or database scripts
4. **Passwords are secure** - Bcrypt hashing, JWT tokens
5. **Each user has isolated data** - Transactions, scores, applications are user-specific

## Next Steps

1. Connect frontend to backend API (replace mock API)
2. Test registration with new users
3. Test login with different credentials
4. Verify user-specific data isolation
5. Add password reset functionality
6. Implement session management
