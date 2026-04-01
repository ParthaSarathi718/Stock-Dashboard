import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# Static list of companies we support for this dashboard
SUPPORTED_COMPANIES = {
    "AAPL": "Apple Inc.",
    "GOOGL": "Alphabet Inc.",
    "MSFT": "Microsoft Corporation",
    "TSLA": "Tesla, Inc.",
    "AMZN": "Amazon.com, Inc.",
    "META": "Meta Platforms, Inc.",
    "NFLX": "Netflix, Inc."
}

def get_companies():
    """Return the list of supported companies as a list of dicts."""
    return [{"symbol": k, "name": v} for k, v in SUPPORTED_COMPANIES.items()]

def fetch_stock_data(symbol: str, days: int = 30) -> pd.DataFrame:
    """
    Fetch the last `days` of stock data for a given symbol using yfinance.
    We fetch extra days under the hood implicitly via dates so we can compute moving averages accurately.
    Returns a pandas DataFrame.
    """
    if symbol not in SUPPORTED_COMPANIES:
        raise ValueError(f"Symbol {symbol} not supported.")
        
    ticker = yf.Ticker(symbol)
    end_date = datetime.now()
    # Add buffer days so our 30-day moving average has valid historical data even on day 1
    start_date = end_date - timedelta(days=days + 45)  
    
    # Fetch historical data
    hist = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
    
    if hist.empty:
        raise ValueError(f"No data found for symbol {symbol}")
        
    # Standardize column names (yfinance uses Date as index)
    hist.reset_index(inplace=True)
    
    # Normalize Date column to string to avoid JSON serialization issues later
    if 'Date' in hist.columns:
        hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
    
    return hist
