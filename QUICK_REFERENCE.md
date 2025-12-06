# 🚀 FinBridge Quick Reference

## 📋 Your Questions - Answered!

### 1️⃣ Chatbot Now Understands More! 💬

**Before:** Only 4 specific queries
**Now:** 10+ query types!

Try asking:
```
✅ "What's my income?"
✅ "How much am I spending?"
✅ "What's the EMI for 150000?"
✅ "How much am I saving?"
✅ "Can I afford a loan of 200000?"
✅ "What loan products are available?"
✅ "How can I improve my score?"
✅ "What's my health score?"
✅ "Hello" / "Thanks"
```

---

### 2️⃣ Access Your Database 🗄️

**Quick Access:**
```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge

# Then run queries:
SELECT * FROM users;
SELECT * FROM transactions WHERE user_id = 1;
SELECT * FROM loan_products;
```

**GUI Tools:**
- pgAdmin (comes with PostgreSQL)
- DBeaver (download from dbeaver.io)
- VS Code PostgreSQL extension

📖 **Full Guide:** `DATABASE_ACCESS.md`

---

### 3️⃣ Create Multiple Users with Different Passwords 👥

**The backend already supports this!** Here's how:

#### Method 1: Use the Script (Easiest)
```bash
cd backend
node ../scripts/create-user.js "Alice" alice@example.com alice123
node ../scripts/create-user.js "Bob" bob@example.com bob456
```

#### Method 2: Use the API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie",
    "email": "charlie@example.com",
    "password": "charlie789",
    "role": "BORROWER"
  }'
```

#### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "alice123"}'
```

📖 **Full Guide:** `AUTHENTICATION_GUIDE.md`

---

## 🎯 Quick Commands

### Create New User
```bash
cd backend
node ../scripts/create-user.js "Name" email@example.com password123
```

### Access Database
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge
```

### View Users
```sql
SELECT id, name, email, role FROM users;
```

### View Transactions
```sql
SELECT * FROM transactions WHERE user_id = 1 ORDER BY date DESC LIMIT 10;
```

### Test API
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "borrower@demo.com", "password": "password"}'
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `QUESTIONS_ANSWERED.md` | Detailed answers to your 3 questions |
| `DATABASE_ACCESS.md` | Complete database access guide |
| `AUTHENTICATION_GUIDE.md` | User management & authentication |
| `SETUP_COMPLETE.md` | Initial setup summary |
| `README.md` | Project overview |

---

## 🔐 Security Features

✅ **Bcrypt password hashing** - Passwords never stored in plain text
✅ **JWT tokens** - Secure authentication (7-day expiry)
✅ **User isolation** - Each user has their own data
✅ **Protected routes** - Token validation on every request

---

## 🎨 Enhanced Chatbot Capabilities

| Category | Examples |
|----------|----------|
| **Loan Queries** | "Can I afford 200000?", "What loans are available?" |
| **Financial Data** | "What's my income?", "How much am I spending?" |
| **Calculations** | "EMI for 150000?", "How much am I saving?" |
| **Scores** | "What's my eligibility?", "Health score?" |
| **Advice** | "How to improve my score?" |
| **General** | "Hello", "Thanks" |

---

## 🚀 Running Services

```bash
# Backend (Port 5000)
cd backend
npm run dev

# Frontend (Port 3000)
cd frontend
npm start

# Check Status
curl http://localhost:5000/api/health
curl http://localhost:3000
```

---

## 💡 Pro Tips

1. **Create test users** with the script before testing
2. **Use pgAdmin** for visual database management
3. **Check backend logs** if API calls fail
4. **JWT tokens** are stored in response - save them for API testing
5. **Each user's data is isolated** - transactions, scores, etc.

---

## 🆘 Need Help?

- **Chatbot not responding?** Check the enhanced patterns in `App.jsx`
- **Can't access database?** Verify PostgreSQL is running
- **Login fails?** Create user with the script first
- **API errors?** Check backend console logs

---

**Everything is documented and ready to use!** 🎉

Check the detailed guides for more information.
