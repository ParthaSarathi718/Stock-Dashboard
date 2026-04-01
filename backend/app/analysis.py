import pandas as pd
import numpy as np

def calculate_moving_averages(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate 7-day and 30-day Simple Moving Averages (SMA)."""
    df = df.copy()
    # rolling() computes the window metrics over the preceding 'window' periods.
    df['MA_7'] = df['Close'].rolling(window=7, min_periods=1).mean()
    df['MA_30'] = df['Close'].rolling(window=30, min_periods=1).mean()
    return df

def calculate_daily_returns(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate daily returns: (Close - Open) / Open."""
    df = df.copy()
    df['Daily_Return'] = (df['Close'] - df['Open']) / df['Open']
    df['Daily_Return_Pct'] = df['Daily_Return'] * 100
    return df

def get_volatility_score(df: pd.DataFrame) -> dict:
    """Calculate the standard deviation of daily returns to determine market volatility."""
    df_with_returns = calculate_daily_returns(df)
    
    # Analyze the most recent 30 days for volatility context
    recent_returns = df_with_returns.tail(30)['Daily_Return_Pct']
    volatility = recent_returns.std()
    
    # Categorize volatility based on typical stock movements
    status = "Low"
    if pd.isna(volatility):
        volatility = 0.0
    elif volatility > 2.5:
        status = "High"
    elif volatility > 1.2:
        status = "Medium"
        
    return {
        "score": round(volatility, 2),
        "status": status
    }

def detect_trend(df: pd.DataFrame) -> str:
    """Detect if the stock is currently in an uptrend or downtrend based on MAs."""
    df_ma = calculate_moving_averages(df)
    
    if len(df_ma) == 0:
        return "Unknown"
        
    latest = df_ma.iloc[-1]
    
    # Simple logic: If short-term MA > long-term MA, it's generally an uptrend (Golden Cross concept)
    if latest['MA_7'] > latest['MA_30']:
        return "Uptrend 📈"
    else:
        return "Downtrend 📉"
