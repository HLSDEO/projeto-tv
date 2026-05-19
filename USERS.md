# 👤 User Management Guide

This guide explains how to manage users in the TV DLOG application.

## Default Admin Account

When you start the application for the first time, a default admin account is automatically created:

- **Username**: `admin`
- **Password**: `admin123`

## First Time Setup

1. Start the application:
   ```bash
   docker-compose up
   ```

2. Check the backend logs for initialization messages:
   ```bash
   docker-compose logs backend
   ```

   You should see messages like:
   ```
   ✅ Connected to ArangoDB
   👤 Default admin user created (username: admin, password: admin123)
   ```

3. Login with the default credentials at http://localhost:5173

## Logging In

### Via Web Interface

1. Go to http://localhost:5173
2. Enter your username
3. Enter your password
4. Click "Login"

### Via API (cURL)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

Use this token in subsequent requests:
```bash
curl -X GET http://localhost:8000/api/media \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Creating New Users

Only the admin user can create new users.

### Via API

```bash
# Step 1: Get admin token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  | jq -r '.access_token')

# Step 2: Create new user
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "password": "securepass456"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "User 'operator1' created successfully"
}
```

### Requirements

- Username: minimum 3 characters
- Password: minimum 6 characters
- Username must be unique

## Listing Users

Only the admin user can view all users.

### Via API

```bash
curl -X GET http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "username": "admin",
      "created_at": null
    },
    {
      "username": "operator1",
      "created_at": "2026-05-19T10:30:00"
    },
    {
      "username": "operator2",
      "created_at": "2026-05-19T11:45:00"
    }
  ]
}
```

## Resetting Passwords

### Admin Resetting Another User's Password

```bash
# Admin can reset any user's password
curl -X PUT "http://localhost:8000/api/admin/users/operator1/password?new_password=newpass789" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Users Resetting Their Own Password

```bash
# Users can reset their own password
curl -X PUT "http://localhost:8000/api/admin/users/operator1/password?new_password=mynewpass" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Requirements:**
- New password: minimum 6 characters

**Response:**
```json
{
  "status": "success",
  "message": "Password for user 'operator1' reset successfully"
}
```

## Deleting Users

Only the admin user can delete users. The admin account itself cannot be deleted.

### Via API

```bash
curl -X DELETE http://localhost:8000/api/admin/users/operator1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "message": "User 'operator1' deleted successfully"
}
```

## Troubleshooting

### Cannot Login with Default Credentials

If the default admin account is not working:

#### Option 1: Restart Backend

```bash
docker-compose restart backend
```

Wait ~30 seconds for the database to initialize, then try logging in again.

#### Option 2: Reset Database

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up
```

### Forgot Admin Password

To reset the admin password:

#### Via ArangoDB Web Interface

1. Go to http://localhost:8529
2. Login with `root` / `rootpassword`
3. Select database `tv_dlog_db`
4. Go to Collections > users
5. Edit the `admin` document
6. Update the password hash (you'll need to hash the new password first)

#### Via Python Script

Create a temporary script:

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_hash = pwd_context.hash("newadminpass123")
print(f"New password hash: {new_hash}")
```

Then update the admin user in ArangoDB with the new hash.

### Permission Errors

If you see "Only admin can..." error:

- The endpoint requires admin permissions
- Only the `admin` user can manage other users
- Check that you're using a token from the admin account

## Database Structure

User accounts are stored in the `users` collection in ArangoDB:

```json
{
  "_key": "admin",
  "_id": "users/admin",
  "_rev": "_...",
  "username": "admin",
  "password_hash": "$2b$12$..."
}
```

**Never share the password hash**. It's a bcrypt hash and cannot be reversed, but it should be kept secure.

## Security Best Practices

1. **Change Default Password**: Change the admin password after first setup
   ```bash
   curl -X PUT "http://localhost:8000/api/admin/users/admin/password?new_password=strongnewpassword" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

2. **Use Strong Passwords**: Minimum 6 characters, but preferably 12+ with mixed case and numbers

3. **Limit Admin Access**: Create separate user accounts for operators instead of sharing admin credentials

4. **Secure Token Storage**: Tokens are valid for 24 hours. Don't store them in plain text.

5. **Use HTTPS**: In production, always use HTTPS instead of HTTP

## Testing Authentication

A test script is provided to verify authentication:

```bash
# On Linux/Mac
bash test_auth.sh

# On Windows (requires bash or Git Bash)
bash test_auth.sh http://localhost:8000
```

This script will:
- Test admin login
- List all users
- Create a new test user
- Test login with the new user
- Verify API access

## API Token Usage

All API requests (except login) require an authorization token:

```bash
curl -X GET http://localhost:8000/api/media \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

**Token Format**: `Bearer <token>`

**Token Expiration**: 24 hours

## Frontend User Interface

The admin dashboard allows authorized users to:

- Upload media files
- Manage media order
- Set display durations
- Toggle news display

Only authenticated users can access these features.
