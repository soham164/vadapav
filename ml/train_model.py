#!/usr/bin/env python3
"""
FinBridge ML Training Script
Trains loan eligibility prediction model using simulated data
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import pickle
import os
import json

# Configuration
N_SAMPLES = 5000
RANDOM_STATE = 42
MODEL_DIR = 'ml/models'

def generate_training_data(n_samples=N_SAMPLES):
    """
    Generate synthetic training data for loan eligibility prediction
    """
    np.random.seed(RANDOM_STATE)
    
    data = []
    
    for i in range(n_samples):
        # Generate base financial features
        avg_monthly_income = np.random.choice([
            np.random.uniform(10000, 25000),   # Low income
            np.random.uniform(25000, 50000),   # Medium income
            np.random.uniform(50000, 100000),  # High income
            np.random.uniform(100000, 200000)  # Very high income
        ], p=[0.3, 0.4, 0.25, 0.05])
        
        # Income stability (coefficient of variation)
        income_stability = np.random.beta(8, 2)  # Skewed towards stable
        
        # Expense to income ratio
        base_expense_ratio = np.random.beta(2, 3)  # Skewed towards lower ratios
        expense_to_income_ratio = np.clip(base_expense_ratio, 0.3, 0.95)
        
        # Existing EMI to income ratio
        emi_to_income_ratio = np.random.beta(1.5, 5)  # Skewed towards lower EMIs
        emi_to_income_ratio = np.clip(emi_to_income_ratio, 0, 0.6)
        
        # Cashflow consistency (% of months with positive cashflow)
        cashflow_consistency = np.random.beta(5, 2)  # Skewed towards consistent
        
        # Number of months with transaction history
        months_history = np.random.choice([3, 6, 12, 18, 24, 36], 
                                         p=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05])
        
        # Credit history score (if available)
        has_credit_history = np.random.choice([0, 1], p=[0.3, 0.7])
        credit_score = 0 if has_credit_history == 0 else np.random.uniform(300, 900)
        
        # Business characteristics
        business_age_years = np.random.exponential(3)  # Average 3 years
        business_age_years = np.clip(business_age_years, 0.5, 20)
        
        # Calculate default probability based on features
        default_score = 0
        
        # Income factors
        if avg_monthly_income < 20000:
            default_score += 30
        elif avg_monthly_income < 40000:
            default_score += 15
        else:
            default_score -= 10
        
        # Stability factors
        if income_stability < 0.6:
            default_score += 20
        elif income_stability > 0.8:
            default_score -= 15
        
        # Expense factors
        if expense_to_income_ratio > 0.8:
            default_score += 25
        elif expense_to_income_ratio < 0.6:
            default_score -= 10
        
        # EMI factors
        if emi_to_income_ratio > 0.4:
            default_score += 30
        elif emi_to_income_ratio < 0.2:
            default_score -= 5
        
        # Cashflow factors
        if cashflow_consistency < 0.5:
            default_score += 20
        elif cashflow_consistency > 0.8:
            default_score -= 15
        
        # Credit history
        if has_credit_history and credit_score > 700:
            default_score -= 20
        elif has_credit_history and credit_score < 500:
            default_score += 25
        
        # Business age
        if business_age_years < 1:
            default_score += 15
        elif business_age_years > 5:
            default_score -= 10
        
        # History length
        if months_history < 6:
            default_score += 15
        elif months_history >= 12:
            default_score -= 10
        
        # Convert to probability and add noise
        default_prob = 1 / (1 + np.exp(-default_score / 20))
        default_prob = np.clip(default_prob + np.random.normal(0, 0.1), 0, 1)
        
        # Determine default (1 = default, 0 = no default)
        default = 1 if np.random.random() < default_prob else 0
        
        data.append({
            'avg_monthly_income': avg_monthly_income,
            'income_stability': income_stability,
            'expense_to_income_ratio': expense_to_income_ratio,
            'emi_to_income_ratio': emi_to_income_ratio,
            'cashflow_consistency': cashflow_consistency,
            'months_history': months_history,
            'has_credit_history': has_credit_history,
            'credit_score': credit_score,
            'business_age_years': business_age_years,
            'default': default
        })
    
    df = pd.DataFrame(data)
    return df

def train_models(df):
    """
    Train multiple models and select the best one
    """
    # Prepare features and target
    feature_columns = [
        'avg_monthly_income', 'income_stability', 'expense_to_income_ratio',
        'emi_to_income_ratio', 'cashflow_consistency', 'months_history',
        'has_credit_history', 'credit_score', 'business_age_years'
    ]
    
    X = df[feature_columns]
    y = df['default']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train multiple models
    models = {
        'Logistic Regression': LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, max_depth=10),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=RANDOM_STATE, max_depth=5)
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        if name == 'Logistic Regression':
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Evaluate
        auc_score = roc_auc_score(y_test, y_pred_proba)
        
        print(f"\n{name} Results:")
        print(f"ROC-AUC Score: {auc_score:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        
        results[name] = {
            'model': model,
            'auc_score': auc_score,
            'predictions': y_pred,
            'probabilities': y_pred_proba
        }
    
    # Select best model based on AUC score
    best_model_name = max(results, key=lambda k: results[k]['auc_score'])
    best_model = results[best_model_name]['model']
    
    print(f"\n{'='*60}")
    print(f"Best Model: {best_model_name} (AUC: {results[best_model_name]['auc_score']:.4f})")
    print(f"{'='*60}")
    
    return best_model, scaler, feature_columns, results[best_model_name]['auc_score']

def save_model(model, scaler, feature_columns, metrics):
    """
    Save trained model and associated artifacts
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Save model
    model_path = os.path.join(MODEL_DIR, 'eligibility_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\n✓ Model saved to {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(MODEL_DIR, 'scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"✓ Scaler saved to {scaler_path}")
    
    # Save feature columns and metadata
    metadata = {
        'feature_columns': feature_columns,
        'model_type': type(model).__name__,
        'auc_score': metrics,
        'training_date': pd.Timestamp.now().isoformat(),
        'n_features': len(feature_columns)
    }
    
    metadata_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata saved to {metadata_path}")

def main():
    print("="*60)
    print("FinBridge ML Model Training")
    print("="*60)
    
    # Generate training data
    print(f"\n1. Generating {N_SAMPLES} synthetic training samples...")
    df = generate_training_data(N_SAMPLES)
    
    print(f"\nDataset shape: {df.shape}")
    print(f"Default rate: {df['default'].mean():.2%}")
    print("\nFeature statistics:")
    print(df.describe())
    
    # Save training data
    data_path = os.path.join(MODEL_DIR, 'training_data.csv')
    os.makedirs(MODEL_DIR, exist_ok=True)
    df.to_csv(data_path, index=False)
    print(f"\n✓ Training data saved to {data_path}")
    
    # Train models
    print("\n2. Training models...")
    model, scaler, feature_columns, auc_score = train_models(df)
    
    # Save model
    print("\n3. Saving model artifacts...")
    save_model(model, scaler, feature_columns, auc_score)
    
    print("\n" + "="*60)
    print("Training completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Test the model using: python ml/inference.py")
    print("2. Integrate with backend API")
    print("3. Monitor model performance in production")

if __name__ == '__main__':
    main()