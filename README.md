# 🏦 FinBridge - Microfinance Platform

A comprehensive microfinance platform for small businesses featuring ML-powered loan eligibility scoring, financial health assessment, and intelligent loan matching.

![FinBridge](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-20.x-green)
![Python](https://img.shields.io/badge/Python-3.10-blue)

## 🌟 Features

### 📊 Cash Flow Dashboard
- Real-time income and expense tracking
- Interactive charts and visualizations
- Monthly trend analysis
- Transaction management

### 💬 Financial Advice Chatbot
- AI-powered financial advisor
- Loan affordability calculations
- Personalized recommendations
- EMI estimations

### 🎯 Loan Eligibility Scoring
- ML-based creditworthiness assessment
- Risk level classification (LOW/MEDIUM/HIGH)
- Contributing factors analysis
- Score improvement recommendations

### 💪 Financial Health Score
- Comprehensive wellness rating (0-100)
- Multi-factor breakdown:
  - Cashflow Stability
  - Savings Rate
  - Debt Management
  - Loan Eligibility
- Visual analytics with pie charts

### 🔍 Loan Matching Engine
- Smart loan product recommendations
- EMI calculations
- Interest rate comparisons
- Risk assessment
- Multiple lender options

### 🛡️ Fraud & Risk Monitoring (Admin)
- Real-time risk flag detection
- Unusual transaction pattern analysis
- Risk level categorization
- User activity monitoring

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Machine Learning
- **Python 3.10** - ML runtime
- **scikit-learn** - ML algorithms
- **pandas** - Data processing
- **NumPy** - Numerical computing

## 📋 Prerequisites

- Node.js 16+ 
- Python 3.8+
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/finbridge.git
cd finbridge
```

### 2. Database Setup
```bash
# Create database
createdb finbridge

# Run schema (Windows)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge -f database/schema.sql

# Run schema (Linux/Mac)
psql -U postgres -d finbridge -f database/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
# Edit backend/.env with your database credentials

npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 5. ML Model Training
```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finbridge
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

### Database Configuration
Update `ml/inference.py` and `backend/server.js` with your PostgreSQL credentials.

## 🎮 Usage

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### Demo Credentials
- **Borrower**: borrower@demo.com / password
- **Admin**: admin@demo.com / password

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

#### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/bulk` - Bulk upload

#### Cash Flow
- `GET /api/cashflow/summary` - Get cashflow summary

#### ML Services
- `GET /api/ml/eligibility-score` - Get eligibility score
- `GET /api/ml/health-score` - Get health score

#### Loan Products
- `GET /api/loan-products` - Get all loan products
- `GET /api/loan-applications` - Get user applications
- `POST /api/loan-applications` - Create application

#### Loan Matching
- `POST /api/loan-matching/recommendations` - Get recommendations

#### Chatbot
- `POST /api/chatbot/message` - Send message

#### Risk Monitoring (Admin)
- `GET /api/fraud/flags` - Get risk flags
- `POST /api/fraud/analyze/:userId` - Analyze user risk

## 🤖 Machine Learning

### Model Details
- **Algorithm**: Gradient Boosting Classifier
- **Features**: 9 financial indicators
- **Performance**: AUC Score 0.7828
- **Training Data**: 5000 synthetic samples

### Features Used
1. Average Monthly Income
2. Income Stability
3. Expense to Income Ratio
4. EMI to Income Ratio
5. Cashflow Consistency
6. Months of History
7. Credit History Flag
8. Credit Score
9. Business Age

### Retraining the Model
```bash
cd ml
python train_model.py
```

## 📊 Database Schema

### Main Tables
- `users` - User accounts
- `business_profiles` - Business information
- `transactions` - Financial transactions
- `loan_products` - Available loan products
- `loan_applications` - Loan applications
- `model_scores` - ML model scores
- `risk_flags` - Risk monitoring flags
- `chatbot_conversations` - Chat history

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### ML Model Evaluation
```bash
cd ml
python train_model.py
```

## 📁 Project Structure
```
finbridge/
├── backend/              # Express backend
│   ├── server.js        # Main server file
│   ├── routes/          # API routes
│   └── middleware/      # Custom middleware
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.jsx     # Main app component
│   │   ├── index.js    # Entry point
│   │   └── index.css   # Styles
│   └── public/         # Static files
├── ml/                  # Machine learning
│   ├── train_model.py  # Model training
│   ├── inference.py    # Predictions
│   └── models/         # Trained models
├── database/           # Database files
│   ├── schema.sql     # Database schema
│   ├── migrations/    # DB migrations
│   └── seeds/         # Seed data
└── docs/              # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React team for the amazing framework
- scikit-learn for ML capabilities
- PostgreSQL for robust database
- Tailwind CSS for beautiful styling

## 📞 Support

For support, email support@finbridge.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced ML models (Deep Learning)
- [ ] Real-time notifications
- [ ] Document upload and OCR
- [ ] Integration with payment gateways
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Comprehensive test coverage

## 📈 Status

Project is: _in active development_

---

Made with ❤️ for small businesses
