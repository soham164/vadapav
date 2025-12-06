-- database/schema.sql
-- FinBridge Microfinance Platform Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('BORROWER', 'LENDER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business profiles table
CREATE TABLE business_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    sector VARCHAR(100),
    location VARCHAR(255),
    registration_number VARCHAR(100),
    established_date DATE,
    annual_turnover DECIMAL(15, 2),
    employee_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan products table
CREATE TABLE loan_products (
    id SERIAL PRIMARY KEY,
    lender_name VARCHAR(255) NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL,
    max_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    min_tenure INTEGER NOT NULL,
    max_tenure INTEGER NOT NULL,
    constraints JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan applications table
CREATE TABLE loan_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_product_id INTEGER REFERENCES loan_products(id),
    requested_amount DECIMAL(15, 2) NOT NULL,
    tenure INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED')),
    approved_amount DECIMAL(15, 2),
    approved_interest_rate DECIMAL(5, 2),
    disbursement_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model scores table
CREATE TABLE model_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    eligibility_score INTEGER CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    model_version VARCHAR(50),
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk flags table
CREATE TABLE risk_flags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_application_id INTEGER REFERENCES loan_applications(id) ON DELETE SET NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    reasons JSONB,
    flagged_by VARCHAR(50) DEFAULT 'SYSTEM',
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVIEWED', 'RESOLVED')),
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot conversations table (optional for history)
CREATE TABLE chatbot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_model_scores_user_id ON model_scores(user_id);
CREATE INDEX idx_risk_flags_user_id ON risk_flags(user_id);
CREATE INDEX idx_risk_flags_status ON risk_flags(status);

-- Seed data: Insert sample loan products
INSERT INTO loan_products (lender_name, min_amount, max_amount, interest_rate, min_tenure, max_tenure, constraints) VALUES
('MicroFin Bank', 50000, 500000, 12.5, 12, 60, '{"min_income": 20000, "max_debt_ratio": 0.4, "min_health_score": 50}'),
('SME Credit Union', 100000, 1000000, 11.0, 24, 84, '{"min_income": 40000, "max_debt_ratio": 0.35, "min_health_score": 60}'),
('Business Growth NBFC', 25000, 300000, 14.0, 6, 36, '{"min_income": 15000, "max_debt_ratio": 0.45, "min_health_score": 40}'),
('QuickCash Lenders', 10000, 200000, 15.5, 6, 24, '{"min_income": 10000, "max_debt_ratio": 0.5, "min_health_score": 35}'),
('Prime Business Finance', 200000, 2000000, 10.0, 36, 120, '{"min_income": 60000, "max_debt_ratio": 0.3, "min_health_score": 70}'),
('StartUp Accelerator Fund', 50000, 750000, 13.0, 12, 48, '{"min_income": 25000, "max_debt_ratio": 0.4, "min_health_score": 55}'),
('Women Entrepreneurs Bank', 30000, 400000, 11.5, 12, 60, '{"min_income": 18000, "max_debt_ratio": 0.4, "min_health_score": 45}'),
('Rural Development Finance', 15000, 250000, 13.5, 12, 36, '{"min_income": 12000, "max_debt_ratio": 0.45, "min_health_score": 40}');

-- Seed data: Create demo users
INSERT INTO users (name, email, password_hash, role) VALUES
('Demo Borrower', 'borrower@demo.com', '$2a$10$X7vL5z8Z9YZvHZvZLZvZ.OZvZ9YZvHZvZLZvZ9YZvHZvZLZvZ9YZvH', 'BORROWER'),
('Admin User', 'admin@demo.com', '$2a$10$X7vL5z8Z9YZvHZvZLZvZ.OZvZ9YZvHZvZLZvZ9YZvHZvZLZvZ9YZvH', 'ADMIN'),
('Jane Smith', 'jane@business.com', '$2a$10$X7vL5z8Z9YZvHZvZLZvZ.OZvZ9YZvHZvZLZvZ9YZvHZvZLZvZ9YZvH', 'BORROWER');

-- Note: The password_hash above is for 'password' - change in production!
-- To generate: const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10);

-- Seed data: Create business profiles
INSERT INTO business_profiles (user_id, business_name, sector, location) VALUES
(1, 'Demo Store', 'Retail', 'Mumbai, Maharashtra'),
(3, 'Jane''s Boutique', 'Fashion', 'Delhi, Delhi');

-- Seed data: Insert sample transactions for demo user (user_id = 1)
INSERT INTO transactions (user_id, date, amount, type, category, description) VALUES
(1, '2024-10-01', 45000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-10-03', 3500, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-10-05', 2000, 'expense', 'Operating Costs', 'Rent payment'),
(1, '2024-10-08', 52000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-10-10', 4200, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-10-12', 1500, 'expense', 'Operating Costs', 'Utilities'),
(1, '2024-10-15', 48000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-10-17', 3800, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-10-20', 2500, 'expense', 'Operating Costs', 'Staff salaries'),
(1, '2024-10-22', 51000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-10-24', 4000, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-10-27', 1800, 'expense', 'Operating Costs', 'Marketing'),
(1, '2024-10-29', 49000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-11-01', 3600, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-11-03', 2000, 'expense', 'Operating Costs', 'Rent payment'),
(1, '2024-11-05', 53000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-11-08', 4100, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-11-10', 1600, 'expense', 'Operating Costs', 'Utilities'),
(1, '2024-11-12', 50000, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-11-15', 3900, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-11-17', 2300, 'expense', 'Operating Costs', 'Maintenance'),
(1, '2024-11-20', 52500, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-11-22', 4200, 'expense', 'Inventory', 'Stock purchase'),
(1, '2024-11-25', 2500, 'expense', 'Operating Costs', 'Staff salaries'),
(1, '2024-11-27', 48500, 'income', 'Sales Revenue', 'Weekly sales'),
(1, '2024-11-29', 3700, 'expense', 'Inventory', 'Stock purchase');

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_products_updated_at BEFORE UPDATE ON loan_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_flags_updated_at BEFORE UPDATE ON risk_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();