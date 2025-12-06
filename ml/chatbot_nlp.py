#!/usr/bin/env python3
"""
FinBridge NLP-Powered Chatbot
Uses NLTK and machine learning for natural language understanding
"""

import json
import pickle
import random
import numpy as np
import nltk
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import os

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')
    
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('corpora/omw-1.4')
except LookupError:
    nltk.download('omw-1.4')

class FinancialChatbot:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.intents = self.load_intents()
        self.model = None
        self.vectorizer = None
        self.intent_labels = []
        
    def load_intents(self):
        """Load chatbot intents and training data"""
        return {
            "intents": [
                {
                    "tag": "greeting",
                    "patterns": [
                        "Hi", "Hello", "Hey", "Good morning", "Good afternoon", 
                        "Good evening", "Greetings", "What's up", "How are you",
                        "Hi there", "Hello there", "Hey there"
                    ],
                    "responses": [
                        "Hello! I'm your financial advisor. How can I help you today?",
                        "Hi there! I'm here to help with your financial questions.",
                        "Greetings! What financial information can I provide for you?",
                        "Hello! Ready to assist you with loans, savings, and financial planning."
                    ]
                },
                {
                    "tag": "goodbye",
                    "patterns": [
                        "Bye", "Goodbye", "See you", "Talk to you later", "Catch you later",
                        "I'm leaving", "Have to go", "Exit", "Quit", "Thanks bye"
                    ],
                    "responses": [
                        "Goodbye! Feel free to return if you have more questions.",
                        "See you later! Take care of your finances!",
                        "Bye! Remember to check your financial health regularly.",
                        "Take care! I'm here whenever you need financial advice."
                    ]
                },
                {
                    "tag": "thanks",
                    "patterns": [
                        "Thanks", "Thank you", "That's helpful", "Thanks a lot",
                        "I appreciate it", "Thanks for the help", "Appreciate it",
                        "Thank you so much", "Perfect thanks"
                    ],
                    "responses": [
                        "You're welcome! Happy to help!",
                        "Glad I could assist you!",
                        "Anytime! Feel free to ask more questions.",
                        "My pleasure! Let me know if you need anything else."
                    ]
                },
                {
                    "tag": "loan_affordability",
                    "patterns": [
                        "Can I afford a loan", "How much loan can I take", "Loan affordability",
                        "What loan amount can I get", "Am I eligible for loan", "Can I get a loan",
                        "How much can I borrow", "What's my loan capacity", "Loan eligibility amount",
                        "Maximum loan I can take", "Can I afford", "Loan amount for me"
                    ],
                    "responses": [
                        "Based on your financial profile, I can calculate your loan affordability. Your average monthly income and expense ratio are key factors. Would you like me to check your specific loan capacity?",
                        "To determine loan affordability, I analyze your income, expenses, and existing obligations. Your current financial health score suggests you may qualify for loans. Shall I provide specific recommendations?",
                        "Loan affordability depends on your income stability and debt-to-income ratio. Based on your transaction history, I can estimate your borrowing capacity. Would you like detailed calculations?"
                    ],
                    "action": "calculate_affordability"
                },
                {
                    "tag": "emi_calculation",
                    "patterns": [
                        "Calculate EMI", "What's the EMI", "EMI for loan", "Monthly installment",
                        "How much is EMI", "EMI calculation", "Monthly payment", "Installment amount",
                        "What will be my EMI", "EMI calculator", "Monthly EMI", "Calculate monthly payment"
                    ],
                    "responses": [
                        "I can calculate your EMI based on loan amount, interest rate, and tenure. Please specify the loan amount you're interested in.",
                        "EMI calculation requires the loan amount, interest rate, and repayment period. What loan amount are you considering?",
                        "I'll help you calculate the monthly EMI. Could you tell me the loan amount you need?"
                    ],
                    "action": "calculate_emi"
                },
                {
                    "tag": "income_query",
                    "patterns": [
                        "What's my income", "Show my income", "My earnings", "How much do I earn",
                        "Total income", "Monthly income", "Income details", "My salary",
                        "What do I make", "Income summary", "Earnings report", "Income statement"
                    ],
                    "responses": [
                        "Let me fetch your income details from your transaction history.",
                        "I'll analyze your income patterns and provide a summary.",
                        "Checking your income records now..."
                    ],
                    "action": "get_income"
                },
                {
                    "tag": "expense_query",
                    "patterns": [
                        "What are my expenses", "Show expenses", "How much do I spend",
                        "My spending", "Expense details", "Where does my money go",
                        "Spending patterns", "Expense breakdown", "What am I spending on",
                        "Monthly expenses", "Expense report", "Spending summary"
                    ],
                    "responses": [
                        "I'll analyze your expense patterns and show you where your money is going.",
                        "Let me break down your expenses by category.",
                        "Fetching your expense details now..."
                    ],
                    "action": "get_expenses"
                },
                {
                    "tag": "savings_query",
                    "patterns": [
                        "How much am I saving", "My savings", "Savings rate", "Am I saving enough",
                        "What's my savings", "Savings amount", "How much do I save",
                        "Savings percentage", "Net savings", "Savings summary", "Saving money"
                    ],
                    "responses": [
                        "I'll calculate your savings based on your income and expenses.",
                        "Let me analyze your savings rate and provide recommendations.",
                        "Checking your savings patterns now..."
                    ],
                    "action": "get_savings"
                },
                {
                    "tag": "eligibility_score",
                    "patterns": [
                        "What's my eligibility score", "Loan eligibility", "Credit score",
                        "Am I eligible", "Eligibility check", "My score", "Credit rating",
                        "Loan approval chances", "What's my rating", "Eligibility status",
                        "Check my eligibility", "Score details"
                    ],
                    "responses": [
                        "I'll fetch your loan eligibility score calculated by our ML model.",
                        "Let me check your eligibility score based on your financial profile.",
                        "Analyzing your eligibility score now..."
                    ],
                    "action": "get_eligibility"
                },
                {
                    "tag": "health_score",
                    "patterns": [
                        "Financial health", "Health score", "How healthy are my finances",
                        "Financial wellness", "My financial health", "Health rating",
                        "Financial status", "How am I doing financially", "Financial checkup",
                        "Overall financial health", "Wellness score"
                    ],
                    "responses": [
                        "I'll provide your comprehensive financial health score.",
                        "Let me analyze your overall financial wellness.",
                        "Checking your financial health score now..."
                    ],
                    "action": "get_health"
                },
                {
                    "tag": "improve_score",
                    "patterns": [
                        "How to improve score", "Improve my rating", "Better credit score",
                        "Increase eligibility", "Improve financial health", "Tips to improve",
                        "How can I improve", "Make my score better", "Boost my score",
                        "Improve my chances", "Better financial health", "Score improvement tips"
                    ],
                    "responses": [
                        "I'll provide personalized tips to improve your financial scores.",
                        "Let me analyze your profile and suggest improvements.",
                        "Based on your current status, here are ways to improve..."
                    ],
                    "action": "improve_tips"
                },
                {
                    "tag": "loan_products",
                    "patterns": [
                        "What loans are available", "Show loan products", "Loan options",
                        "Available loans", "Types of loans", "Loan offerings", "What loans do you have",
                        "Loan products", "Show me loans", "Available loan schemes"
                    ],
                    "responses": [
                        "I'll show you the available loan products that match your profile.",
                        "Let me fetch the loan options suitable for you.",
                        "Checking available loan products now..."
                    ],
                    "action": "get_loan_products"
                },
                {
                    "tag": "loan_recommendation",
                    "patterns": [
                        "Recommend a loan", "Best loan for me", "Which loan should I take",
                        "Loan suggestions", "Suitable loans", "Match me with loans",
                        "Find loans for me", "Best loan options", "Loan matching",
                        "What loan fits me", "Personalized loan recommendations"
                    ],
                    "responses": [
                        "I'll analyze your profile and recommend the best loan products.",
                        "Let me match you with suitable loan options.",
                        "Finding the best loans for your financial situation..."
                    ],
                    "action": "recommend_loans"
                },
                {
                    "tag": "financial_advice",
                    "patterns": [
                        "Financial advice", "Money tips", "How to manage money",
                        "Financial planning", "Budgeting tips", "Money management",
                        "Financial guidance", "Help with finances", "Money advice",
                        "Financial tips", "How to save money", "Budget advice"
                    ],
                    "responses": [
                        "I can provide personalized financial advice based on your profile. What specific area would you like guidance on?",
                        "I'm here to help with financial planning. Would you like advice on budgeting, saving, or loan management?",
                        "Let me provide tailored financial advice based on your current situation."
                    ],
                    "action": "financial_advice"
                },
                {
                    "tag": "transaction_history",
                    "patterns": [
                        "Show transactions", "Transaction history", "My transactions",
                        "Recent transactions", "Transaction list", "Payment history",
                        "Show my payments", "Transaction details", "Recent payments"
                    ],
                    "responses": [
                        "I'll fetch your recent transaction history.",
                        "Let me show you your transaction records.",
                        "Retrieving your transaction history now..."
                    ],
                    "action": "get_transactions"
                },
                {
                    "tag": "help",
                    "patterns": [
                        "Help", "What can you do", "How can you help", "Features",
                        "What do you offer", "Capabilities", "What questions can I ask",
                        "How to use", "Guide", "Instructions", "What can I ask"
                    ],
                    "responses": [
                        "I can help you with:\n• Loan affordability and EMI calculations\n• Income, expense, and savings analysis\n• Eligibility and health scores\n• Loan recommendations\n• Financial advice and tips\n• Transaction history\n\nWhat would you like to know?",
                        "I'm your AI financial advisor! I can analyze your finances, calculate loan eligibility, recommend products, and provide personalized advice. What can I help you with today?",
                        "I offer comprehensive financial assistance including loan calculations, score analysis, product recommendations, and money management tips. How can I assist you?"
                    ]
                }
            ]
        }
    
    def preprocess_text(self, text):
        """Preprocess and tokenize text"""
        tokens = nltk.word_tokenize(text.lower())
        return ' '.join([self.lemmatizer.lemmatize(token) for token in tokens])
    
    def train(self):
        """Train the NLP model"""
        print("Training NLP chatbot model...")
        
        # Prepare training data
        patterns = []
        labels = []
        
        for intent in self.intents['intents']:
            for pattern in intent['patterns']:
                patterns.append(self.preprocess_text(pattern))
                labels.append(intent['tag'])
        
        # Create and train pipeline
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=1000)),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        
        self.model.fit(patterns, labels)
        self.intent_labels = list(set(labels))
        
        print(f"✅ Model trained with {len(patterns)} patterns and {len(self.intent_labels)} intents")
        
        # Save model
        self.save_model()
    
    def save_model(self):
        """Save trained model"""
        model_dir = 'ml/models'
        os.makedirs(model_dir, exist_ok=True)
        
        with open(f'{model_dir}/chatbot_model.pkl', 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(f'{model_dir}/chatbot_intents.json', 'w') as f:
            json.dump(self.intents, f, indent=2)
        
        print("✅ Chatbot model saved")
    
    def load_model(self):
        """Load trained model"""
        try:
            with open('ml/models/chatbot_model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            print("✅ Chatbot model loaded")
            return True
        except FileNotFoundError:
            print("⚠️ Model not found. Training new model...")
            self.train()
            return True
    
    def predict_intent(self, message):
        """Predict intent from user message"""
        processed_message = self.preprocess_text(message)
        intent = self.model.predict([processed_message])[0]
        probabilities = self.model.predict_proba([processed_message])[0]
        confidence = max(probabilities)
        
        return intent, confidence
    
    def get_response(self, message):
        """Get chatbot response"""
        intent, confidence = self.predict_intent(message)
        
        # If confidence is too low, return help message
        if confidence < 0.3:
            return {
                'intent': 'unknown',
                'confidence': confidence,
                'response': "I'm not sure I understood that. I can help you with loan calculations, financial scores, expense analysis, and more. What would you like to know?",
                'action': None
            }
        
        # Find intent and get response
        for intent_data in self.intents['intents']:
            if intent_data['tag'] == intent:
                response = random.choice(intent_data['responses'])
                action = intent_data.get('action', None)
                
                return {
                    'intent': intent,
                    'confidence': confidence,
                    'response': response,
                    'action': action
                }
        
        return {
            'intent': 'unknown',
            'confidence': 0,
            'response': "I'm here to help with your financial questions. What would you like to know?",
            'action': None
        }

def main():
    """Main entry point"""
    import sys
    
    chatbot = FinancialChatbot()
    
    # Train or load model
    if not os.path.exists('ml/models/chatbot_model.pkl'):
        chatbot.train()
    else:
        chatbot.load_model()
    
    # Check if running in prediction mode (called from backend)
    if len(sys.argv) > 1 and sys.argv[1] == 'predict':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Message required'}))
            sys.exit(1)
        
        message = sys.argv[2]
        result = chatbot.get_response(message)
        print(json.dumps(result))
        sys.exit(0)
    
    # Interactive mode
    print("\n" + "="*60)
    print("FinBridge AI Chatbot - NLP Powered")
    print("="*60)
    print("Type 'quit' to exit\n")
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['quit', 'exit', 'bye']:
            print("Chatbot: Goodbye! Take care of your finances!")
            break
        
        result = chatbot.get_response(user_input)
        print(f"Chatbot: {result['response']}")
        print(f"[Intent: {result['intent']}, Confidence: {result['confidence']:.2f}]")
        if result['action']:
            print(f"[Action: {result['action']}]")
        print()

if __name__ == '__main__':
    main()
