# MongoDB & Supabase Auth Setup Verification

## ✅ Database Schema

### Collections
Your application uses 3 MongoDB collections:

1. **users** - Stores user profiles synced from Supabase
   - `supabaseId` (unique) - Links to Supabase auth user
   - `email` (unique)
   - `fullName`, `avatarUrl`
   - `role` - "admin" or "member"

2. **projects** - Stores project data
   - `title`, `description`, `status`, `deadline`
   - `createdBy` - Supabase user ID
   - `members[]` - Array of Supabase user IDs
   - Computed fields: `taskCount`, `completedTaskCount`, `memberCount`

3. **tasks** - Stores task data
   - `title`, `description`, `status`, `deadline`
   - `projectId` - References Project
   - `assignedTo` - Supabase user ID (optional)
   - `createdBy` - Supabase user ID

---

## 🔄 Supabase ↔ MongoDB Sync

### How It Works

```mermaid
sequenceDiagram
    participant U as User
    participant S as Supabase Auth
    participant F as Frontend
    participant B as Backend API
    participant M as MongoDB

    U->>S: Sign up/Login
    S->>F: JWT Token + User Data
    F->>B: POST /api/users/sync (with JWT)
    B->>S: Verify JWT Token
    S->>B: User ID + Metadata
    B->>M: Create/Update User
    M->>B: User Document
    B->>F: MongoDB User Data
```

### User Sync Endpoint

**Endpoint:** `POST /api/users/sync`  
**Auth:** Required (JWT Bearer token)  
**Purpose:** Creates or updates MongoDB user when Supabase user logs in

**Flow:**
1. Frontend calls this endpoint after Supabase login
2. Backend extracts user data from Supabase JWT
3. Checks if user exists in MongoDB by `supabaseId`
4. Creates new user OR updates existing user
5. Returns MongoDB user document

---

## 🚀 Database Indexes (Performance)

Added indexes for optimal query performance:

###User Model
- `supabaseId` (unique) - Fast user lookups
- `email` (unique) - Email validation

### Project Model
- `createdBy` - Filter projects by creator
- `members` - Filter projects by member
- `status` - Filter by project status

### Task Model
- `projectId` - Get all tasks in a project
- `assignedTo` - Get user's assigned tasks
- `createdBy` - Get tasks created by user
- `status` - Filter by task status
- `deadline` - Sort/filter by due date

---

## ✅ Verification Script

Run the initialization script to verify your setup:

```bash
cd backend
npm run init-db
```

This will:
- ✅ Connect to MongoDB
- ✅ Create/verify all indexes
- ✅ Show existing collections
- ✅ Display document counts
- ✅ Explain sync workflow

---

## 🎯 First-Time Setup Checklist

- [x] MongoDB connection configured
- [x] User model with Supabase sync
- [x] Project model with references
- [x] Task model with foreign keys
- [x] Database indexes added
- [x] User sync endpoint (`/api/users/sync`)
- [x] JWT authentication middleware
- [ ] **TODO:** Frontend needs to call `/api/users/sync` on login

---

## 🔍 Testing the Sync

### 1. Login via Frontend
```typescript
// After Supabase login
const { data: { session } } = await supabase.auth.signInWithPassword({...});

// Sync user to MongoDB
await userService.sync(); // Calls POST /api/users/sync
```

### 2. Verify in MongoDB
```bash
# Connect to MongoDB
mongosh "mongodb+srv://anasaltaf:***@aegistrack.yl7gend.mongodb.net/aegistrack"

# Check users
db.users.find()

# Check if supabaseId matches Supabase auth user
```

### 3. Check Backend Logs
```
Server is running on port 5000
Connected to MongoDB
```

---

## 🎉 Summary

| Component | Status |
|-----------|--------|
| MongoDB Connection | ✅ Working |
| User Schema + Indexes | ✅ Complete |
| Project Schema + Indexes | ✅ Complete |
| Task Schema + Indexes | ✅ Complete |
| User Sync Endpoint | ✅ Implemented |
| JWT Auth Middleware | ✅ Working |
| ID Transform (_id → id) | ✅ Applied |

**Your MongoDB setup is complete and ready!** 🚀

The sync between Supabase (auth) and MongoDB (data) happens automatically when users call the `/api/users/sync` endpoint after login.
