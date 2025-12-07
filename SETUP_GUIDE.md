# FinBridge Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [ML Service Setup](#ml-service-setup)
7. [Running the Application](#running-the-application)
8. [Docker Deployment](#docker-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v16+): https://nodejs.org/
- **PostgreSQL** (v12+): https://www.postgresql.org/download/
- **Python** (v3.8+): https://www.python.org/downloads/
- **Git**: https://git-scm.com/
- **npm** or **yarn**: Package managers for Node.js
- **pip**: Python package manager

### Verify Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python3 --version
pip3 --version

# Check PostgreSQL
psql --version
```

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/soham164/vadapav.git
cd vadapav
```

### 2. Create Environment Files

**Backend** - `backend/.env`
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finbridge
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Backend Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345

# ML Service
ML_SERVICE_URL=http://localhost:8000
PYTHON_EXECUTABLE=python3

# CORS Settings (Dev)
CORS_ORIGIN=http://localhost:3000
```

**Frontend** - `frontend/.env`
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

**ML Service** - `ml/.env`
```env
FLASK_ENV=development
FLASK_APP=inference.py
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finbridge
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
```

### 3. Install Dependencies

**Backend**
```bash
cd backend
npm install
cd ..
```

**Frontend**
```bash
cd frontend
npm install
cd ..
```

**ML Service**
```bash
cd ml
pip3 install -r requirements.txt
cd ..
```

---

## Database Setup

### 1. Start PostgreSQL
```bash
# On macOS (if installed via Homebrew)
brew services start postgresql

# On Windows (PostgreSQL service should auto-start)
# Or manually start from Services

# On Linux
sudo service postgresql start
```

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE finbridge;
CREATE USER finbridge_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE finbridge TO finbridge_user;
\q
```

### 3. Initialize Database Schema
```bash
# Navigate to project root
cd project_root

# Run schema creation
psql -U postgres -d finbridge -f database/schema.sql

# Seed initial data (optional)
psql -U postgres -d finbridge -f database/seeds.sql
```

### 4. Verify Database
```bash
# Connect to finbridge database
psql -U postgres -d finbridge

# Check tables
\dt

# You should see: users, business_profiles, transactions, loan_products, etc.

# Exit
\q
```

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `backend/.env` with database credentials (see above)

### 3. Run Migrations (Optional - if using migration tool)
```bash
# If using Flyway or similar
npm run migrate
```

### 4. Test Backend
```bash
# Run health check endpoint
curl http://localhost:5000/api/health

# Should return: { "status": "OK", ... }
```

### 5. Development Server
```bash
# Start with nodemon (auto-reload)
npm run dev

# Or production mode
npm start
```

Expected output:
```
✅ FinBridge Backend running on port 5000
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `frontend/.env` with API base URL (see above)

### 3. Development Server
```bash
npm start
```

This will open http://localhost:3000 in your browser automatically.

### 4. Build for Production
```bash
npm run build

# Output will be in build/ directory
```

---

## ML Service Setup

### 1. Install Python Dependencies
```bash
cd ml
pip3 install -r requirements.txt
```

### 2. Verify Requirements
```
pandas==1.5.0
numpy==1.23.0
scikit-learn==1.1.0
psycopg2-binary==2.9.0
python-dotenv==0.20.0
flask==2.2.0
flask-cors==3.0.10
```

### 3. Train the Model
```bash
python3 train_model.py

# Output:
# ✅ Model training completed
# ✅ Model saved to ml/models/eligibility_model.pkl
# ✅ Scaler saved to ml/models/scaler.pkl
# ✅ Metadata saved to ml/models/model_metadata.json
```

### 4. Start Inference Service
```bash
python3 inference.py

# Or with Flask
flask run --port 8000
```

Expected output:
```
 * Running on http://127.0.0.1:8000
```

---

## Running the Application

### Complete Startup Sequence

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

**Terminal 3 - ML Service** (Optional - backend calls Python directly)
```bash
cd ml
python3 inference.py
# Runs on http://localhost:8000
```

### Testing the Application

**1. Register a New User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "BORROWER",
    "business_name": "Johns Store",
    "sector": "Retail",
    "location": "Mumbai"
  }'
```

**2. Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Save the token from response
```

**3. Add Transactions**
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-07",
    "amount": 50000,
    "type": "income",
    "category": "Sales",
    "description": "Business revenue"
  }'
```

**4. Get Cashflow Summary**
```bash
curl http://localhost:5000/api/cashflow/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**5. Get Eligibility Score**
```bash
curl http://localhost:5000/api/ml/eligibility-score \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**6. Access Frontend**
Open http://localhost:3000 and log in with the credentials created above

---

## Docker Deployment

### 1. Build Docker Images
```bash
# From project root
docker build -t finbridge-backend ./backend
docker build -t finbridge-frontend ./frontend
docker build -t finbridge-ml ./ml
```

### 2. Docker Compose Setup
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Check Container Status
```bash
docker ps

# Should show: backend, frontend, ml, postgres
```

### 4. Access Services
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- ML Service: http://localhost:8000
- PostgreSQL: localhost:5432

---

## Environment Secrets Management

### Production Setup
For production deployment:

**1. Use Environment Variables**
```bash
export DB_PASSWORD='production_secure_password'
export JWT_SECRET='production_jwt_secret'
export NODE_ENV='production'
```

**2. Use AWS Secrets Manager / Azure Key Vault**
```javascript
// In backend, use AWS SDK
const secretValue = await secretsClient.getSecretValue({
  SecretId: 'finbridge/db-password'
});
```

**3. CI/CD Pipeline**
Set secrets in GitHub Actions / GitLab CI and use `${VARIABLE_NAME}` syntax

---

## Troubleshooting

### Backend Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Database Connection Error
```bash
# Check PostgreSQL status
psql -U postgres -d finbridge -c "SELECT 1"

# Check DB credentials in .env
# Verify PostgreSQL is running
```

### Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install
npm start
```

### Python ML Module Not Found
```bash
# Reinstall ML dependencies
cd ml
pip3 install --upgrade -r requirements.txt

# Verify scikit-learn installation
python3 -c "import sklearn; print(sklearn.__version__)"
```

### JWT Token Invalid
- Check token is passed correctly in Authorization header
- Verify JWT_SECRET matches between backend and frontend
- Token expires after 7 days - user needs to re-login

### Models Not Training
```bash
# Check Python version
python3 --version

# Run training with verbose output
python3 train_model.py -v

# Check if PostgreSQL is accessible to Python
python3 -c "import psycopg2; print('OK')"
```

---

## Performance Optimization

### Backend
- Enable connection pooling: `pool: { max: 20 }`
- Add Redis caching for loan products
- Implement request rate limiting

### Frontend
- Code splitting with React.lazy()
- Lazy load charts with suspense
- Memoize expensive computations

### Database
- Add indexes on frequently queried columns
- Partition transactions table by year
- Archive old records

### ML Service
- Cache model predictions
- Batch process scoring requests
- Use GPU acceleration if available

---

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your frontend domain
- [ ] Hash passwords with bcrypt (already done)
- [ ] Add rate limiting to auth endpoints
- [ ] Sanitize user input (use parameterized queries)
- [ ] Add SQL injection protection
- [ ] Enable database SSL connections
- [ ] Set secure HTTP headers
- [ ] Regular security audits

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [scikit-learn ML Guide](https://scikit-learn.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
