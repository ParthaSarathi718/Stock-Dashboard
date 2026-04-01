from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Dict, Any

from cachetools import TTLCache, cached
import pandas as pd

from . import models, schemas, auth, database
from .data_fetcher import get_companies, fetch_stock_data, SUPPORTED_COMPANIES
from .analysis import calculate_moving_averages, calculate_daily_returns, get_volatility_score, detect_trend
from .prediction import predict_future_price

router = APIRouter()
cache = TTLCache(maxsize=50, ttl=900)

# --- AUTH AND USER ENDPOINTS ---

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- WATCHLIST ENDPOINTS ---

@router.get("/watchlist", response_model=List[schemas.WatchlistItem])
def get_watchlist(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Watchlist).filter(models.Watchlist.user_id == current_user.id).all()

@router.post("/watchlist", response_model=schemas.WatchlistItem)
def add_to_watchlist(item: schemas.WatchlistItemBase, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    symbol = item.symbol.upper()
    if symbol not in SUPPORTED_COMPANIES:
        raise HTTPException(status_code=400, detail="Stock symbol not supported")
        
    existing = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id, 
        models.Watchlist.symbol == symbol
    ).first()
    if existing:
        return existing
        
    db_item = models.Watchlist(symbol=symbol, user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/watchlist/{symbol}")
def delete_from_watchlist(symbol: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_item = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id, 
        models.Watchlist.symbol == symbol.upper()
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")
        
    db.delete(db_item)
    db.commit()
    return {"status": "success", "message": f"{symbol} removed"}

# --- DATA AND ML ENDPOINTS ---

@router.get("/companies")
def list_companies() -> List[Dict[str, str]]:
    return get_companies()

@cached(cache)
def _get_processed_stock_data(symbol: str) -> pd.DataFrame:
    symbol = symbol.upper()
    if symbol not in SUPPORTED_COMPANIES:
        raise ValueError(f"Symbol {symbol} not recognized. Supported: {list(SUPPORTED_COMPANIES.keys())}")
    df = fetch_stock_data(symbol, days=45)
    df = calculate_moving_averages(df)
    df = calculate_daily_returns(df)
    return df

@router.get("/stock/{symbol}")
def get_stock_data(symbol: str) -> Dict[str, Any]:
    try:
        df = _get_processed_stock_data(symbol)
        last_30 = df.tail(30).copy()
        last_30 = last_30.where(pd.notnull(last_30), None)
        records = last_30.to_dict(orient="records")
        return {"symbol": symbol.upper(), "data": records}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/summary/{symbol}")
def get_stock_summary(symbol: str) -> Dict[str, Any]:
    try:
        symbol = symbol.upper()
        df = _get_processed_stock_data(symbol)
        last_30 = df.tail(30)
        
        avg_price = last_30['Close'].mean()
        latest_price = last_30.iloc[-1]['Close']
        
        volatility = get_volatility_score(df)
        trend = detect_trend(df)
        
        prediction_res = predict_future_price(df)
        
        return {
            "symbol": symbol,
            "company_name": SUPPORTED_COMPANIES.get(symbol),
            "latest_price": round(float(latest_price), 2),
            "average_price_30d": round(float(avg_price), 2),
            "trend": trend,
            "volatility": volatility,
            "ai_prediction": prediction_res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/compare")
def compare_stocks(stocks: str = Query(..., description="Comma-separated symbols, e.g., AAPL,GOOGL")) -> Dict[str, Any]:
    symbols = [s.strip().upper() for s in stocks.split(",")]
    result_data = {}
    dates = []
    
    for symbol in symbols:
        try:
            df = _get_processed_stock_data(symbol)
            last_30 = df.tail(30)
            if not dates:
                dates = last_30['Date'].tolist()
            result_data[symbol] = [round(x, 2) if pd.notnull(x) else 0 for x in last_30['Daily_Return_Pct'].tolist()]
        except Exception as e:
            pass
            
    return {
        "dates": dates,
        "returns": result_data
    }
