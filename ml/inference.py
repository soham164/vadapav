#!/usr/bin/env python3
"""
FinBridge ML Inference Script
Provides predictions for loan eligibility and financial health scores
"""

import sys
import os
import pickle
import json
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
MODEL_DIR = 'ml/models'
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'finbridge'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

def load_model_artifacts():
    """Load trained model, scaler, and metadata"""
    model_path = os.path.join(MODEL_DIR, 'eligibility_model.pkl')
    scaler_path = os.path.join(MODEL_DIR, 'scaler.pkl')
    metadata_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    return model, scaler, metadata

def get_user_transactions(user_id):
    """Fetch user transactions from database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT date, amount, type, category
            FROM transactions
            WHERE user_id = %s
            ORDER BY date
        """
        cursor.execute(query, (user_id,))
        transactions = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return pd.DataFrame(transactions)
    except Exception as e:
        print(f"Database error: {e}", file=sys.stderr)
        return pd.DataFrame()

def calculate_financial_features(df_transactions):
    """Calculate financial features from transaction history"""
    if df_transactions.empty:
        return None
    
    # Monthly aggregation
    df_transactions['month'] = pd.to_datetime(df_transactions['date']).dt.to_period('M')
    
    monthly_data = df_transactions.groupby('month').apply(
        lambda x: pd.Series({
            'income': x[x['type'] == 'income']['amount'].sum(),
            'expenses': x[x['type'] == 'expense']['amount'].sum()
        })
    ).reset_index()
    
    monthly_data['net_cashflow'] = monthly_data['income'] - monthly_data['expenses']
    
    # Calculate features
    avg_monthly_income = monthly_data['income'].mean()
    income_std = monthly_data['income'].std()
    income_stability = 1 - (income_std / avg_monthly_income) if avg_monthly_income > 0 else 0
    income_stability = np.clip(income_stability, 0, 1)
    
    avg_monthly_expenses = monthly_data['expenses'].mean()
    expense_to_income_ratio = avg_monthly_expenses / avg_monthly_income if avg_monthly_income > 0 else 1
    expense_to_income_ratio = np.clip(expense_to_income_ratio, 0, 1)
    
    # Assume 20% of income goes to existing EMIs (simplified)
    emi_to_income_ratio = 0.2
    
    positive_cashflow_months = (monthly_data['net_cashflow'] > 0).sum()
    cashflow_consistency = positive_cashflow_months / len(monthly_data) if len(monthly_data) > 0 else 0
    
    months_history = len(monthly_data)
    
    # Simplified credit history (would come from credit bureau in production)
    has_credit_history = 1 if months_history >= 6 else 0
    credit_score = 650 + (income_stability * 200) if has_credit_history else 0
    
    # Estimate business age (simplified)
    business_age_years = months_history / 12
    
    features = {
        'avg_monthly_income': avg_monthly_income,
        'income_stability': income_stability,
        'expense_to_income_ratio': expense_to_income_ratio,
        'emi_to_income_ratio': emi_to_income_ratio,
        'cashflow_consistency': cashflow_consistency,
        'months_history': months_history,
        'has_credit_history': has_credit_history,
        'credit_score': credit_score,
        'business_age_years': business_age_years
    }
    
    return features

def predict_eligibility(user_id):
    """Predict loan eligibility score for a user"""
    # Load model
    model, scaler, metadata = load_model_artifacts()
    
    # Get user data
    df_transactions = get_user_transactions(user_id)
    
    if df_transactions.empty:
        return {
            'eligibility_score': 30,
            'risk_level': 'HIGH',
            'factors': [
                {'factor': 'Transaction History', 'impact': 'No data available'}
            ],
            'error': 'Insufficient transaction history'
        }
    
    # Calculate features
    features = calculate_financial_features(df_transactions)
    
    if features is None:
        return {
            'eligibility_score': 30,
            'risk_level': 'HIGH',
            'factors': [
                {'factor': 'Data Processing', 'impact': 'Unable to process data'}
            ],
            'error': 'Feature calculation failed'
        }
    
    # Prepare feature vector
    feature_values = [features[col] for col in metadata['feature_columns']]
    X = np.array(feature_values).reshape(1, -1)
    
    # Scale features if model is LogisticRegression
    if 'Logistic' in metadata['model_type']:
        X = scaler.transform(X)
    
    # Predict
    default_probability = model.predict_proba(X)[0][1]
    
    # Convert to eligibility score (inverse of default probability)
    eligibility_score = int((1 - default_probability) * 100)
    eligibility_score = np.clip(eligibility_score, 0, 100)
    
    # Determine risk level
    if eligibility_score >= 70:
        risk_level = 'LOW'
    elif eligibility_score >= 50:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'HIGH'
    
    # Generate factor explanations
    factors = [
        {
            'factor': 'Average Monthly Income',
            'impact': 'Positive' if features['avg_monthly_income'] > 30000 else 'Needs Improvement'
        },
        {
            'factor': 'Income Stability',
            'impact': 'Strong' if features['income_stability'] > 0.7 else 'Moderate'
        },
        {
            'factor': 'Expense Control',
            'impact': 'Good' if features['expense_to_income_ratio'] < 0.7 else 'High'
        },
        {
            'factor': 'Cashflow Consistency',
            'impact': 'Excellent' if features['cashflow_consistency'] > 0.7 else 'Variable'
        }
    ]
    
    return {
        'eligibility_score': eligibility_score,
        'risk_level': risk_level,
        'factors': factors,
        'features': features
    }

def calculate_health_score(user_id):
    """Calculate comprehensive financial health score"""
    # Get eligibility score first
    eligibility_result = predict_eligibility(user_id)
    
    if 'error' in eligibility_result:
        return {
            'health_score': 35,
            'category': 'At Risk',
            'breakdown': {
                'cashflow_stability': 0,
                'savings_rate': 0,
                'debt_ratio': 100,
                'eligibility': eligibility_result['eligibility_score']
            }
        }
    
    features = eligibility_result['features']
    
    # Calculate health score components
    cashflow_stability_score = int(features['cashflow_consistency'] * 100)
    
    # Savings rate estimation
    savings_rate = max(0, 1 - features['expense_to_income_ratio'])
    savings_rate_score = int(savings_rate * 100)
    
    # Debt management (inverse of EMI ratio)
    debt_score = int((1 - features['emi_to_income_ratio']) * 100)
    
    # Weighted health score
    health_score = (
        cashflow_stability_score * 0.30 +
        savings_rate_score * 0.25 +
        debt_score * 0.20 +
        eligibility_result['eligibility_score'] * 0.25
    )
    health_score = int(np.clip(health_score, 0, 100))
    
    # Categorize
    if health_score >= 75:
        category = 'Healthy'
    elif health_score >= 60:
        category = 'Stable'
    elif health_score >= 40:
        category = 'Needs Improvement'
    else:
        category = 'At Risk'
    
    return {
        'health_score': health_score,
        'category': category,
        'breakdown': {
            'cashflow_stability': cashflow_stability_score,
            'savings_rate': savings_rate_score,
            'debt_ratio': 100 - debt_score,
            'eligibility': eligibility_result['eligibility_score']
        }
    }

def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 3:
        print("Usage: python inference.py <eligibility|health> <user_id>")
        sys.exit(1)
    
    command = sys.argv[1]
    user_id = int(sys.argv[2])
    
    try:
        if command == 'eligibility':
            result = predict_eligibility(user_id)
        elif command == 'health':
            result = calculate_health_score(user_id)
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
        
        # Output as JSON for backend to parse
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            'error': str(e),
            'eligibility_score': 30 if command == 'eligibility' else None,
            'health_score': 35 if command == 'health' else None,
            'risk_level': 'HIGH',
            'category': 'At Risk'
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()