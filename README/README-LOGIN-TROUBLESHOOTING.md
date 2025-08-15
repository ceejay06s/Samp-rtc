# Login Troubleshooting Guide

This guide helps you diagnose and fix "Invalid login credentials" errors and other authentication issues.

## 🚨 **Common Login Issues**

### 1. **"Invalid login credentials" Error**

**Symptoms:**
```
❌ Sign in failed: AuthApiError: Invalid login credentials
```

**Possible Causes:**
- User doesn't exist in the database
- Incorrect email or password
- User exists but profile is missing
- Database connection issues
- Supabase configuration problems

## 🔍 **Step-by-Step Diagnosis**

### **Step 1: Check Database Connection**

Use the LoginTroubleshooter component to test your Supabase connection:

```typescript
import { LoginTroubleshooter } from '../src/components/auth/LoginTroubleshooter';

// Add to any screen for testing
<LoginTroubleshooter />
```

**Expected Result:**
```
✅ Supabase connection successful
```

**If Failed:**
- Check your Supabase URL and API key
- Verify internet connection
- Check Supabase service status

### **Step 2: Verify User Exists**

**Check if user exists in profiles table:**
```sql
SELECT * FROM profiles WHERE user_id = 'user@example.com';
```

**Check if user exists in auth.users (requires admin):**
```sql
SELECT * FROM auth.users WHERE email = 'user@example.com';
```

### **Step 3: Test Login Credentials**

Use the LoginTroubleshooter to test login:

**Expected Success:**
```
🔐 Testing login for: user@example.com
✅ Login successful! User ID: [user-id]
👤 Profile: [First Name] [Last Name]
```

**Common Failures:**
```
❌ Login failed: Invalid login credentials
💡 Tip: Check your email and password. Make sure caps lock is off.
```

## 🛠️ **Solutions**

### **Solution 1: Create a Test User**

If no user exists, create one using the LoginTroubleshooter:

1. Enter email and password
2. Click "Create Test User"
3. Try logging in with the created credentials

**Expected Result:**
```
✅ Test user created successfully!
🆔 User ID: [user-id]
👤 Profile: Test User
📧 Email: [email]
🔑 Password: [password]
```

### **Solution 2: Reset Password**

If user exists but password is forgotten:

1. Enter email address
2. Click "Reset Password"
3. Check email for reset link
4. Set new password

### **Solution 3: Fix Missing Profile**

If user exists in auth but not in profiles:

```sql
-- Create missing profile
INSERT INTO profiles (
  user_id, 
  first_name, 
  last_name, 
  birthdate, 
  gender,
  created_at,
  updated_at
) VALUES (
  'user-id-from-auth',
  'Test',
  'User',
  '1990-01-01',
  'other',
  NOW(),
  NOW()
);
```

### **Solution 4: Check Supabase Configuration**

Verify your environment variables:

```bash
# .env file
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Test configuration:**
```typescript
import { supabase } from '../lib/supabase';

// Test connection
const { data, error } = await supabase.from('profiles').select('count').limit(1);
console.log('Connection test:', { data, error });
```

## 🔧 **Database Setup**

### **Required Tables**

**1. Profiles Table:**
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  birthdate DATE,
  gender TEXT,
  bio TEXT,
  location TEXT,
  interests TEXT[],
  photos TEXT[],
  looking_for TEXT[],
  max_distance INTEGER DEFAULT 50,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. Row Level Security (RLS):**
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🧪 **Testing Tools**

### **LoginTroubleshooter Component**

A comprehensive testing tool that provides:

- **Connection Testing:** Verify Supabase connectivity
- **User Verification:** Check if users exist
- **Login Testing:** Test credentials
- **User Creation:** Create test users
- **Password Reset:** Reset forgotten passwords

**Usage:**
```typescript
import { LoginTroubleshooter } from '../src/components/auth/LoginTroubleshooter';

// Add to any screen
<LoginTroubleshooter />
```

### **Manual Testing Commands**

**Test Supabase Connection:**
```typescript
const { data, error } = await supabase.from('profiles').select('count').limit(1);
console.log('Connection:', { data, error });
```

**Test User Authentication:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Auth test:', { data, error });
```

**Check Current User:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

## 🚨 **Error Messages & Solutions**

### **"Invalid login credentials"**
- **Cause:** Wrong email/password or user doesn't exist
- **Solution:** Verify credentials or create new user

### **"Profile not found"**
- **Cause:** User exists in auth but not in profiles table
- **Solution:** Create missing profile record

### **"Network error"**
- **Cause:** Internet connection or Supabase service issue
- **Solution:** Check connection and Supabase status

### **"Unauthorized"**
- **Cause:** Invalid API key or URL
- **Solution:** Verify environment variables

### **"User already registered"**
- **Cause:** Trying to create user that already exists
- **Solution:** Use existing credentials to login

## 📋 **Checklist**

### **Before Testing:**
- [ ] Supabase project is active
- [ ] Environment variables are set correctly
- [ ] Database tables are created
- [ ] RLS policies are configured
- [ ] Internet connection is stable

### **During Testing:**
- [ ] Test database connection
- [ ] Verify user exists in database
- [ ] Test login with correct credentials
- [ ] Check profile data is complete
- [ ] Verify online status updates

### **After Testing:**
- [ ] User can login successfully
- [ ] Profile data is loaded
- [ ] Online status is updated
- [ ] No console errors
- [ ] App navigation works correctly

## 🔍 **Debugging Tips**

### **1. Enable Detailed Logging**
```typescript
// In your auth service
console.log('🔐 Starting sign in process for:', email);
console.log('📋 Auth response:', { data: authData, error: authError });
```

### **2. Check Network Tab**
- Open browser developer tools
- Go to Network tab
- Try to login
- Check for failed requests

### **3. Verify Supabase Dashboard**
- Check Authentication > Users
- Check Table Editor > profiles
- Check Logs for errors

### **4. Test with Different Credentials**
- Try creating a new user
- Test with simple password
- Verify email format

## 🆘 **Getting Help**

### **If Issues Persist:**

1. **Check Supabase Status:** https://status.supabase.com
2. **Review Logs:** Check browser console and Supabase logs
3. **Test with LoginTroubleshooter:** Use the provided component
4. **Verify Configuration:** Double-check environment variables
5. **Contact Support:** If all else fails

### **Useful Commands:**

**Check current auth state:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

**List all profiles (admin only):**
```sql
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10;
```

**Check auth users (admin only):**
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

This troubleshooting guide should help you resolve most login issues. Use the LoginTroubleshooter component for interactive diagnosis and testing. 