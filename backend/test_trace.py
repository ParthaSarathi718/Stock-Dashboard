from app.database import SessionLocal
from app import models, schemas, auth
from app.api import register_user

db = SessionLocal()
try:
    user = schemas.UserCreate(username='test_trace1', password='pwd')
    res = register_user(user, db)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
