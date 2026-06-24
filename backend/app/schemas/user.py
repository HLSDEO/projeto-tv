from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserList(BaseModel):
    username: str

class PasswordReset(BaseModel):
    new_password: str
