from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os

# Constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI app
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client.notes
users_collection = db.users
notes_collection = db.notes

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class User(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class NoteCreate(BaseModel):
    title: str
    description: str

class NoteInDB(NoteCreate):
    created_at: datetime = datetime.now()

class Note(BaseModel):
    id: str
    title: str
    description: str
    created_at: datetime
    owner: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.post("/signup")
async def signup(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    users_collection.insert_one({"username": user.username, "password": hashed_password})
    return {"message": "User created successfully"}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/notes", response_model=Note)
async def create_note(note: NoteCreate, current_user: dict = Depends(get_current_user)):
    note_dict = note.dict()
    note_dict["owner"] = current_user["username"]
    note_dict["created_at"] = datetime.now()
    result = notes_collection.insert_one(note_dict)
    created_note = notes_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(created_note["_id"]),
        "title": created_note["title"],
        "description": created_note["description"],
        "created_at": created_note["created_at"].isoformat(),  # Serialize to ISO format
        "owner": created_note["owner"]
    }

@app.get("/notes", response_model=list[Note])
async def read_notes(current_user: dict = Depends(get_current_user)):
    user_notes = notes_collection.find({"owner": current_user["username"]})
    notes = []
    for note in user_notes:
        if "created_at" in note:
            notes.append({
                "id": str(note["_id"]),
                "title": note["title"],
                "description": note["description"],
                "created_at": note["created_at"].isoformat(),  # Serialize to ISO format
                "owner": note["owner"]
            })
    return notes


@app.get("/notes/{note_id}", response_model=Note)
async def read_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = notes_collection.find_one({"_id": ObjectId(note_id), "owner": current_user["username"]})
    if note:
        return {
            "id": str(note["_id"]),
            "title": note["title"],
            "description": note["description"],
            "created_at": note["created_at"].isoformat(),  # Serialize to ISO format
            "owner": note["owner"]
        }
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

@app.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note: NoteCreate, current_user: dict = Depends(get_current_user)):
    updated_note = note.dict()
    result = notes_collection.update_one(
        {"_id": ObjectId(note_id), "owner": current_user["username"]},
        {"$set": updated_note}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Note not found or you're not the owner")

    updated_note_from_db = notes_collection.find_one({"_id": ObjectId(note_id)})
    return {
        "id": str(updated_note_from_db["_id"]),
        "title": updated_note_from_db["title"],
        "description": updated_note_from_db["description"],
        "created_at": updated_note_from_db["created_at"].isoformat(),  # Serialize to ISO format
        "owner": updated_note_from_db["owner"]
    }

@app.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = notes_collection.delete_one({"_id": ObjectId(note_id), "owner": current_user["username"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
