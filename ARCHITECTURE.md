# FinBridge Architecture & Implementation Details

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 18)                         │
│  ┌─────────────┬──────────────┬──────────────┬────────────────┐ │
│  │ Auth Pages  │  Dashboard   │  Loan Pages  │  Admin Panel   │ │
│  │ • Login     │ • Cashflow   │ • Eligibility│ • Risk Monitor │ │
│  │ • Register  │ • Chatbot    │ • Health     │ • User Mgmt    │ │
│  │ • Profile   │ • Metrics    │ • Matching   │ • Analytics    │ │
│  └─────────────┴──────────────┴──────────────┴────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              ↓↑ (HTTP/REST)
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND API (Node.js + Express)                │
│  ┌──────────────┬──────────────┬──────────────┬───────────────┐  │
│  │ Auth Module  │ Transaction  │ ML Integration│ Loan Manager  │  │
│  │ • Register   │ • CRUD Ops   │ • Eligibility│ • Matching    │  │
│  │ • Login      │ • Cashflow   │ • Health     │ • Applications│  │
│  │ • JWT Tokens │ • Analytics  │ • Scoring    │ • Product DB  │  │
│  │ • RBAC       │ • CSV Upload │ • Risk Flag  │ • Recommend   │  │
│  └──────────────┴──────────────┴──────────────┴───────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │         Chatbot Module (Rule-Based NLP Engine)           │    │
│  │  • Intent Recognition  • Entity Extraction              │    │
│  │  • Response Generation • Context Management             │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              ↓↑ (Python Call / HTTP)
┌──────────────────────────────────────────────────────────────────┐
│                    ML SERVICE (Python + Flask)                   │
│  ┌──────────────┬──────────────┬──────────────┐                  │
│  │ Feature      │ ML Models    │ Risk         │                  │
│  │ Engineering  │ • Eligibility│ Detection    │                  │
│  │ • Normalize  │ • Regressor  │ • Flags      │                  │
│  │ • Scale      │ • Classifier │ • Scoring    │                  │
│  │ • Extract    │ Model Mgmt   │ • Reporting  │                  │
│  └──────────────┴──────────────┴──────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓↑ (SQL)
┌──────────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL 12+)                       │
│  ┌──────────────┬──────────────┬──────────────┬───────────────┐  │
│  │ User Data    │ Transactions │ ML Scores    │ Risk Flags    │  │
│  │ • Users      │ • Transactions│ • Eligibility│ • Flags       │  │
│  │ • Business   │ • Categories │ • Health     │ • Analysis    │  │
│  │ • Profile    │ • History    │ • Factors    │ • Metrics     │  │
│  └──────────────┴──────────────┴──────────────┴───────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┐                  │
│  │ Loan Data    │ Applications │ Models       │                  │
│  │ • Products   │ • Status     │ • Metadata   │                  │
│  │ • Lenders    │ • History    │ • Versions   │                  │
│  │ • Terms      │ • Approval   │ • Scores     │                  │
│  └──────────────┴──────────────┴──────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. Frontend Module Structure

**Location:** `frontend/src/`

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── Layout/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── Charts/
│   │   ├── CashflowChart.jsx
│   │   ├── HealthScoreGauge.jsx
│   │   ├── EligibilityMeter.jsx
│   │   └── LoanComparison.jsx
│   ├── Common/
│   │   ├── StatCard.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorAlert.jsx
│   │   └── Modal.jsx
│   └── Chatbot/
│       ├── ChatWindow.jsx
│       ├── MessageBubble.jsx
│       └── ChatInput.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── CashFlowDashboard.jsx
│   ├── FinancialChatbot.jsx
│   ├── LoanEligibility.jsx
│   ├── HealthScore.jsx
│   ├── LoanMatching.jsx
│   ├── FraudRiskMonitoring.jsx
│   └── NotFound.jsx
├── services/
│   ├── api.js                 # Axios instance & config
│   ├── authService.js         # Auth API calls
│   ├── transactionService.js  # Transaction API
│   ├── mlService.js           # ML scoring APIs
│   ├── loanService.js         # Loan APIs
│   └── chatbotService.js      # Chatbot API
├── context/
│   ├── AuthContext.jsx        # User & Auth state
│   ├── FinancialContext.jsx   # Financial data state
│   └── UIContext.jsx          # UI state
├── utils/
│   ├── constants.js           # App constants
│   ├── validators.js          # Input validation
│   ├── formatters.js          # Currency, date formatting
│   └── helpers.js             # Utility functions
├── App.jsx
├── index.js
└── index.css
```

### 2. Backend Module Structure

**Location:** `backend/`

```
backend/
├── server.js              # Main entry point
├── package.json
├── routes/
│   ├── auth.js            # Authentication endpoints
│   ├── transactions.js    # Transaction CRUD
│   ├── cashflow.js        # Cashflow analytics
│   ├── ml.js              # ML scoring endpoints
│   ├── loans.js           # Loan management
│   ├── fraud.js           # Risk detection
│   └── chatbot.js         # Chatbot logic
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── errorHandler.js    # Error handling
│   ├── validation.js      # Input validation
│   └── cors.js            # CORS config
├── controllers/
│   ├── authController.js
│   ├── transactionController.js
│   ├── mlController.js
│   ├── loanController.js
│   └── fraudController.js
├── models/
│   └── database.js        # DB connection pool
├── config/
│   ├── database.js        # DB config
│   ├── constants.js       # App constants
│   └── env.js             # Env loader
└── utils/
    ├── logger.js          # Logging
    ├── tokenUtils.js      # JWT utils
    ├── validators.js      # Input validation
    └── helpers.js         # Helper functions
```

### 3. ML Service Module Structure

**Location:** `ml/`

```
ml/
├── train_model.py         # Model training script
├── inference.py           # Flask app & inference
├── chatbot_nlp.py         # Chatbot engine
├── requirements.txt       # Python dependencies
├── models/
│   ├── eligibility_model.pkl
│   ├── scaler.pkl
│   ├── chatbot_model.pkl
│   ├── vectorizer.pkl
│   └── model_metadata.json
├── data/
│   ├── training_data.csv
│   ├── intents.json       # Chatbot intents
│   └── patterns.json      # Pattern definitions
├── notebooks/
│   ├── EDA.ipynb          # Exploratory data analysis
│   └── ModelEvaluation.ipynb
└── utils/
    ├── db_connector.py
    ├── feature_engineering.py
    ├── data_loader.py
    └── model_utils.py
```

### 4. Database Module Structure

**Location:** `database/`

```
database/
├── schema.sql             # Complete schema definition
├── seeds.sql              # Initial data
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_indexes.sql
│   └── 003_alter_constraints.sql
└── backups/
    └── finbridge_backup.sql
```

---

## Data Models & Relationships

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'BORROWER',  -- BORROWER, LENDER, ADMIN
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Business Profiles Table
```sql
CREATE TABLE business_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  sector VARCHAR(100),
  location VARCHAR(255),
  annual_turnover DECIMAL(15,2),
  employee_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20), -- 'income' or 'expense'
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
```

### Loan Products Table
```sql
CREATE TABLE loan_products (
  id SERIAL PRIMARY KEY,
  lender_name VARCHAR(255) NOT NULL,
  min_amount DECIMAL(15,2) NOT NULL,
  max_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  min_tenure INTEGER NOT NULL,
  max_tenure INTEGER NOT NULL,
  constraints JSONB, -- {min_income, max_debt_ratio, min_health_score}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Loan Applications Table
```sql
CREATE TABLE loan_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  loan_product_id INTEGER REFERENCES loan_products(id),
  requested_amount DECIMAL(15,2) NOT NULL,
  tenure INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DISBURSED
  approved_amount DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_loan_app_user ON loan_applications(user_id);
CREATE INDEX idx_loan_app_status ON loan_applications(status);
```

### Model Scores Table
```sql
CREATE TABLE model_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  eligibility_score INTEGER, -- 0-100
  health_score INTEGER, -- 0-100
  risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH
  model_version VARCHAR(20),
  features JSONB, -- {income, stability, ratio, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for latest score lookup
CREATE INDEX idx_model_scores_user_date ON model_scores(user_id, created_at DESC);
```

### Risk Flags Table
```sql
CREATE TABLE risk_flags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH
  reasons JSONB, -- ["reason1", "reason2", ...]
  flagged_by VARCHAR(50) DEFAULT 'SYSTEM',
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, REVIEWED, RESOLVED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Business Logic & Algorithms

### 1. Eligibility Score Calculation

**Features Used:**
```python
features = {
    'avg_monthly_income': float,        # Average income
    'income_stability': float,          # Std dev / mean
    'expense_to_income_ratio': float,   # Expenses / income
    'emi_to_income_ratio': float,       # EMI / income
    'cashflow_consistency': float,      # % positive months
    'months_history': int,              # Data points
    'business_age_years': float,        # Years in business
    'credit_score': int                 # Historical score
}
```

**Model:** Gradient Boosting Classifier trained on synthetic data

**Output:**
```python
{
    'eligibility_score': 0-100,
    'risk_level': 'LOW' | 'MEDIUM' | 'HIGH',
    'probability_default': 0-1,
    'contributing_factors': [
        {'factor': 'Income Stability', 'impact': 15},
        {'factor': 'Cashflow Consistency', 'impact': 12}
    ]
}
```

### 2. Health Score Formula

```
health_score = (
    0.25 * cashflow_stability_score +
    0.25 * savings_rate_score +
    0.20 * (100 - debt_to_income_score) +
    0.20 * eligibility_score +
    0.10 * repayment_history_score
)

Categories:
- 0-30: At Risk
- 31-60: Needs Improvement
- 61-85: Stable
- 86-100: Healthy
```

### 3. EMI Calculation

```
EMI = P * r * (1+r)^n / ((1+r)^n - 1)

Where:
- P = Principal amount
- r = Monthly interest rate (annual_rate / 12 / 100)
- n = Number of months

Example: ₹200,000 at 12% for 24 months
- Monthly rate = 12/12/100 = 0.01
- EMI = 200000 * 0.01 * (1.01)^24 / ((1.01)^24 - 1) = ₹9,547
```

### 4. Fraud Detection Rules

```python
def detect_fraud(user_id):
    flags = []
    
    # Rule 1: Income Spike
    recent_income = sum(income last 7 days)
    old_income = sum(income before 7 days)
    if recent_income > old_income * 2:
        flags.append('Sudden income spike')
    
    # Rule 2: Large Transactions
    large_tx_count = count(transactions > ₹100,000)
    if large_tx_count > 5:
        flags.append('Multiple large transactions')
    
    # Rule 3: Multiple Applications
    app_count = count(apps in last 30 days)
    if app_count > 3:
        flags.append('Multiple loan applications')
    
    # Rule 4: Pattern Anomaly
    if expense_pattern_deviation > 50%:
        flags.append('Unusual expense pattern')
    
    risk_level = 'HIGH' if len(flags) > 2 else 'MEDIUM' if len(flags) > 0 else 'LOW'
    return {'risk_level': risk_level, 'reasons': flags}
```

### 5. Loan Matching Algorithm

```python
def match_loans(user_eligibility, user_health, requested_amount, tenure):
    matching_products = []
    
    for product in loan_products:
        # Check amount range
        if requested_amount < product.min_amount or requested_amount > product.max_amount:
            continue
        
        # Check tenure range
        if tenure < product.min_tenure or tenure > product.max_tenure:
            continue
        
        # Check eligibility constraints
        constraints = product.constraints
        if user_health < constraints['min_health_score']:
            continue
        if user_debt_ratio > constraints['max_debt_ratio']:
            continue
        
        # Calculate EMI
        emi = calculate_emi(requested_amount, product.interest_rate, tenure)
        emi_to_income = (emi / user_avg_income) * 100
        
        # Calculate suitability score
        suitability = (
            0.3 * (1 - emi_to_income / 100) +  # EMI burden (lower is better)
            0.3 * (100 - product.interest_rate) / 100 +  # Interest rate (lower is better)
            0.2 * (user_eligibility / 100) +  # User eligibility
            0.2 * (user_health / 100)  # User health
        )
        
        matching_products.append({
            'product': product,
            'emi': emi,
            'total_interest': emi * tenure - requested_amount,
            'suitability_score': suitability
        })
    
    # Sort by suitability and return top 5
    return sorted(matching_products, key=lambda x: x['suitability_score'], reverse=True)[:5]
```

---

## API Response Schemas

### Success Response (200)
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Operation completed successfully"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional error details */ }
}
```

---

## Authentication Flow

```
1. User submits email + password
   ↓
2. Backend validates credentials
   ↓
3. Backend hashes password with bcrypt
   ↓
4. If valid, generate JWT token
   - Payload: { id, email, role }
   - Expires: 7 days
   ↓
5. Return token to frontend
   ↓
6. Frontend stores token in localStorage
   ↓
7. For protected endpoints:
   - Frontend sends: Authorization: Bearer <token>
   - Backend verifies token signature
   - Backend extracts user_id and role
   - Checks if user has required role
   ↓
8. On token expiry:
   - Frontend redirects to login
   - User must re-authenticate
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (Jest for backend, RTL for frontend)
- [ ] Update version numbers
- [ ] Create migration scripts
- [ ] Backup production database
- [ ] Review security settings
- [ ] Enable HTTPS
- [ ] Set environment variables for production
- [ ] Configure error monitoring (Sentry)
- [ ] Set up logging infrastructure

### Post-Deployment
- [ ] Monitor application logs
- [ ] Check database performance
- [ ] Verify all endpoints respond
- [ ] Test user workflows end-to-end
- [ ] Monitor error rates
- [ ] Check system resource usage
- [ ] Verify backup schedules

---

## Performance Benchmarks

**Target Metrics:**
- API response time: < 200ms (p95)
- Frontend load time: < 3s
- ML model inference: < 500ms
- Database query: < 100ms (p95)
- Chatbot response: < 1s

**Optimization Techniques:**
- Connection pooling (Backend)
- Query caching (Redis)
- Model caching (ML)
- Code splitting (Frontend)
- Image optimization (Frontend)
- Database indexing (All queries)
