# FinBridge API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### Register User
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "BORROWER",
  "business_name": "John's Store",
  "sector": "Retail",
  "location": "Mumbai"
}
```

Response (201):
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "BORROWER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response (200):
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "BORROWER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Transaction Endpoints

### Get User Transactions
**GET** `/transactions`
- **Auth:** Required
- **Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "date": "2025-12-07",
    "amount": "50000.00",
    "type": "income",
    "category": "Sales",
    "description": "Monthly business revenue",
    "created_at": "2025-12-07T10:00:00Z"
  }
]
```

### Create Transaction
**POST** `/transactions`
- **Auth:** Required
- **Request:**
```json
{
  "date": "2025-12-07",
  "amount": 50000,
  "type": "income",
  "category": "Sales",
  "description": "Monthly business revenue"
}
```
- **Response (201):** Transaction object

### Bulk Upload Transactions
**POST** `/transactions/bulk`
- **Auth:** Required
- **Request:**
```json
{
  "transactions": [
    {
      "date": "2025-12-07",
      "amount": 50000,
      "type": "income",
      "category": "Sales"
    },
    {
      "date": "2025-12-06",
      "amount": 5000,
      "type": "expense",
      "category": "Utilities"
    }
  ]
}
```
- **Response (200):** `{ "success": true, "count": 2 }`

---

## 3. Cashflow Endpoints

### Get Cashflow Summary
**GET** `/cashflow/summary`
- **Auth:** Required
- **Response (200):**
```json
{
  "monthlyData": [
    {
      "month": "2025-11",
      "income": 150000,
      "expenses": 45000,
      "netCashflow": 105000
    },
    {
      "month": "2025-12",
      "income": 200000,
      "expenses": 55000,
      "netCashflow": 145000
    }
  ],
  "totalIncome": 350000,
  "totalExpenses": 100000,
  "netCashflow": 250000,
  "avgMonthlyIncome": 175000,
  "avgMonthlyExpenses": 50000
}
```

---

## 4. Machine Learning Endpoints

### Get Eligibility Score
**GET** `/ml/eligibility-score`
- **Auth:** Required
- **Response (200):**
```json
{
  "user_id": 1,
  "eligibility_score": 78,
  "risk_level": "LOW",
  "factors": [
    {
      "factor": "Average Monthly Income",
      "impact": "Strong Positive",
      "value": 175000
    },
    {
      "factor": "Income Stability",
      "impact": "Good",
      "value": 0.85
    },
    {
      "factor": "Cashflow Consistency",
      "impact": "Excellent",
      "value": 0.92
    }
  ],
  "model_version": "1.0.0",
  "created_at": "2025-12-07T10:00:00Z"
}
```

### Get Health Score
**GET** `/ml/health-score`
- **Auth:** Required
- **Response (200):**
```json
{
  "user_id": 1,
  "health_score": 82,
  "category": "Healthy",
  "breakdown": {
    "cashflow_stability": 85,
    "savings_rate": 70,
    "debt_to_income_ratio": 0.15,
    "eligibility_score": 78,
    "repayment_history": 90
  },
  "created_at": "2025-12-07T10:00:00Z"
}
```

---

## 5. Loan Product Endpoints

### Get All Loan Products
**GET** `/loan-products`
- **Auth:** Required
- **Query Params:** 
  - `status` (optional): "active" | "inactive" (default: "active")
  - `sort_by` (optional): "interest_rate" | "tenure" (default: "interest_rate")
- **Response (200):**
```json
[
  {
    "id": 1,
    "lender_name": "MicroFin Bank",
    "min_amount": 50000,
    "max_amount": 500000,
    "interest_rate": 12.5,
    "min_tenure": 12,
    "max_tenure": 60,
    "constraints": {
      "min_income": 20000,
      "max_debt_ratio": 0.4,
      "min_health_score": 50
    },
    "is_active": true,
    "created_at": "2025-12-01T00:00:00Z"
  }
]
```

---

## 6. Loan Application Endpoints

### Get User's Loan Applications
**GET** `/loan-applications`
- **Auth:** Required
- **Response (200):** Array of loan application objects

### Create Loan Application
**POST** `/loan-applications`
- **Auth:** Required
- **Request:**
```json
{
  "loan_product_id": 1,
  "requested_amount": 200000,
  "tenure": 24
}
```
- **Response (201):** Loan application object with status "PENDING"

---

## 7. Loan Matching Endpoints

### Get Loan Recommendations
**POST** `/loan-matching/recommendations`
- **Auth:** Required
- **Request:**
```json
{
  "requested_amount": 200000,
  "tenure": 24
}
```
- **Response (200):**
```json
[
  {
    "id": 1,
    "lender_name": "MicroFin Bank",
    "interest_rate": 12.5,
    "min_amount": 50000,
    "max_amount": 500000,
    "min_tenure": 12,
    "max_tenure": 60,
    "emi": 9547,
    "total_interest": 29128,
    "total_payable": 229128,
    "emi_to_income_ratio": 5,
    "risk_note": "Comfortable EMI"
  }
]
```

---

## 8. Chatbot Endpoints

### Send Chatbot Message
**POST** `/chatbot/message`
- **Auth:** Required
- **Request:**
```json
{
  "message": "Can I afford a loan of 200000?"
}
```
- **Response (200):**
```json
{
  "response": "Based on your average monthly income of ₹175,000, you can afford a loan of up to ₹2,100,000 with comfortable EMI payments.",
  "intent": "calculate_affordability",
  "confidence": 0.95,
  "timestamp": "2025-12-07T10:00:00Z"
}
```

**Supported Intents:**
- `calculate_affordability` - Loan affordability calculations
- `calculate_emi` - EMI calculations
- `get_income` - Income queries
- `get_expenses` - Expense queries
- `get_savings` - Savings analysis
- `get_eligibility` - Eligibility score info
- `get_health` - Health score info
- `improve_tips` - Score improvement suggestions
- `greetings` - Friendly responses

---

## 9. Fraud & Risk Monitoring Endpoints

### Get Risk Flags (Admin Only)
**GET** `/fraud/flags`
- **Auth:** Required (ADMIN role)
- **Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "risk_level": "MEDIUM",
    "reasons": [
      "Sudden income spike in last 7 days (200% increase)",
      "Multiple large transactions detected"
    ],
    "flagged_by": "SYSTEM",
    "status": "ACTIVE",
    "created_at": "2025-12-07T10:00:00Z"
  }
]
```

### Analyze User Risk
**POST** `/fraud/analyze/:userId`
- **Auth:** Required (ADMIN role)
- **Params:** `userId` - User ID to analyze
- **Response (200):** Risk flag object with analysis

---

## 10. Utility Endpoints

### Health Check
**GET** `/health`
- **Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-12-07T10:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

---

## Rate Limiting & Pagination
- All endpoints return a maximum of 100 records
- For larger datasets, use pagination query params: `?page=1&limit=50`
- Tokens expire after 7 days

## CORS
The API enables CORS for frontend localhost development.
Production deployment should restrict origins in `server.js`.
