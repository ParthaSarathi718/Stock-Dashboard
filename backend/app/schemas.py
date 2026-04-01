from pydantic import BaseModel
from typing import List, Optional

class WatchlistItemBase(BaseModel):
    symbol: str

class WatchlistItem(WatchlistItemBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    watchlists: List[WatchlistItem] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
