import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

def predict_future_price(df: pd.DataFrame) -> dict:
    """
    Use a Random Forest Classifier to predict if the price will go UP or DOWN tomorrow.
    This provides directional momentum prediction leveraging traditional ML.
    """
    df = df.copy()
    
    # Feature Engineering based strictly on historical momentum
    df['Returns'] = df['Close'].pct_change()
    df['MA_5'] = df['Close'].rolling(window=5).mean()
    df['MA_10'] = df['Close'].rolling(window=10).mean()
    df['Momentum'] = df['Close'] - df['Close'].shift(3)
    
    # Target Variable: 1 if tomorrow's Close > today's Close, else 0
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    # Drop NaNs that appear due to shift() and rolling()
    df.dropna(inplace=True)
    
    if len(df) < 15:
        return {"direction": "Neutral", "probability_percent": 50.0}
        
    features = ['Returns', 'MA_5', 'MA_10', 'Momentum']
    X = df[features]
    y = df['Target']
    
    # Train on all known data points
    X_train = X[:-1]
    y_train = y[:-1]
    
    # Test on the very last data point
    X_test = X.iloc[[-1]] 
    
    # Instantiate short forest to prevent aggressive overfitting on mini-batch
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)
    model.fit(X_train, y_train)
    
    prediction = model.predict(X_test)[0]
    probabilities = model.predict_proba(X_test)[0]
    
    # Probability confidence matrix
    confidence = probabilities[1] if prediction == 1 else probabilities[0]
    direction = "UP 🚀" if prediction == 1 else "DOWN 🔻"
    
    return {
        "direction": direction,
        "probability_percent": round(float(confidence * 100), 2)
    }
