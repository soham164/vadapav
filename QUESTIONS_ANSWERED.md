# ✅ Questions Answered

## 1. Why is the chatbot only answering specific things?

### Answer:
The chatbot is **rule-based** (not AI-powered like ChatGPT). It uses pattern matching to detect keywords and respond accordingly.

### What I Fixed:
✅ **Enhanced the chatbot** to handle many more queries:
- Loan affordability
- EMI calculations
- Income/expense analysis
- Savings advice
- Score improvement tips
- Eligibility checks
- Health score details
- Greetings and thanks
- Better default responses

### Try These Questions Now:
- "What's my income?"
- "How much am I spending?"
- "What's the EMI for 150000?"
- "How much am I saving?"
- "What loan products are available?"
- "Hello"
- "Can I afford a loan of 300000?"

### To Make it AI-Powered:
You would need to integrate:
- **OpenAI API** (ChatGPT)
- **Google Gemini API**
- **Anthropic Claude API**
- Or train your own model

---

## 2. How to access the database?

### Answer:
Multiple ways to access your PostgreSQL database!

### Method 1: Command Line (psql)
```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge

# Linux/Mac
psql -U postgres -d finbridge
```

### Method 2: pgAdmin (GUI)
1. Open pgAdmin (comes with PostgreSQL)
2. Create new server connection
3. Enter: localhost, port 5432, database: finbridge

### Method 3: DBeaver (Universal Tool)
1. Download from https://dbeaver.io
2. Create PostgreSQL connection
3. Connect to finbridge database

### Method 4: VS Code Extension
1. Install "PostgreSQL" extension
2. Add connection to finbridge
3. Browse tables visually

### Common Queries:
```sql
-- View all users
SELECT * FROM users;

-- View transactions
SELECT * FROM transactions WHERE user_id = 1;

-- View loan products
SELECT * FROM loan_products;

-- Monthly summary
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
FROM transactions 
WHERE user_id = 1
GROUP BY DATE_TRUNC('month', date);
```

### Full Guide:
See `DATABASE_ACCESS.md` for complete instructions!

---

## 3. What if different users login with different passwords?

### Answer:
The backend **already supports** multiple users with different passwords! The issue is the frontend uses mock data.

### Current Situation:

#### Backend (✅ Ready)
- ✅ Proper authentication with bcrypt password hashing
- ✅ JWT token generation
- ✅ Supports unlimited users
- ✅ Each user can have different password
- ✅ User-specific data isolation

#### Frontend (⚠️ Using Mock Data)
- Currently uses hardcoded demo credentials
- Only accepts: `borrower@demo.com` / `password`
- Doesn't call real backend API yet

### How to Create New Users:

#### Option 1: Using the Script I Created
```bash
cd backend
node ../scripts/create-user.js "Alice Johnson" alice@example.com alice123
node ../scripts/create-user.js "Bob Smith" bob@example.com bob456 BORROWER "Bob's Store" Retail Delhi
```

#### Option 2: Using Backend API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Brown",
    "email": "charlie@example.com",
    "password": "charlie789",
    "role": "BORROWER",
    "business_name": "Charlie's Shop",
    "sector": "Retail",
    "location": "Mumbai"
  }'
```

#### Option 3: Using Postman/Thunder Client
1. POST to `http://localhost:5000/api/auth/register`
2. Send JSON body with user details
3. Get back user object and JWT token

### Testing Login with Different Users:

```bash
# Login as user 1
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "alice123"}'

# Login as user 2
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com", "password": "bob456"}'
```

### How Authentication Works:

1. **Registration**:
   - User provides email + password
   - Password is hashed with bcrypt (10 rounds)
   - Stored in database (never plain text)
   - JWT token generated

2. **Login**:
   - User provides email + password
   - Backend fetches user from database
   - Compares password with bcrypt
   - If valid, returns JWT token

3. **Protected Routes**:
   - User sends JWT token in header
   - Backend validates token
   - Returns user-specific data

### User Data Isolation:

Each user has their own:
- ✅ Transactions
- ✅ Loan applications
- ✅ ML scores
- ✅ Business profile
- ✅ Chatbot history

### Password Security:

✅ **Bcrypt hashing** - Passwords never stored in plain text
✅ **Salt rounds: 10** - Strong protection against rainbow tables
✅ **JWT tokens** - Expire after 7 days
✅ **Token validation** - On every protected route

### Example: Create 3 Different Users

```bash
cd backend

# User 1: Retail business
node ../scripts/create-user.js "Raj Kumar" raj@shop.com raj123 BORROWER "Raj's Electronics" Electronics Mumbai

# User 2: Fashion business
node ../scripts/create-user.js "Priya Sharma" priya@fashion.com priya456 BORROWER "Priya's Boutique" Fashion Delhi

# User 3: Admin
node ../scripts/create-user.js "Admin User" admin@finbridge.com admin789 ADMIN
```

Now you can login with:
- raj@shop.com / raj123
- priya@fashion.com / priya456
- admin@finbridge.com / admin789

### Full Guide:
See `AUTHENTICATION_GUIDE.md` for complete details!

---

## Summary

| Question | Status | Solution |
|----------|--------|----------|
| **Chatbot limited responses** | ✅ Fixed | Enhanced with 10+ query types |
| **Database access** | ✅ Documented | Multiple methods provided |
| **Multiple users/passwords** | ✅ Ready | Backend supports it, scripts provided |

## Quick Start Commands

```bash
# Create a new user
cd backend
node ../scripts/create-user.js "Your Name" your@email.com yourpassword

# Access database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge

# Test login API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}'
```

## Files Created

1. ✅ `DATABASE_ACCESS.md` - Complete database access guide
2. ✅ `AUTHENTICATION_GUIDE.md` - User management & auth guide
3. ✅ `scripts/create-user.js` - Easy user creation script
4. ✅ Enhanced chatbot in `frontend/src/App.jsx`

---

**All your questions are now answered with working solutions!** 🎉
