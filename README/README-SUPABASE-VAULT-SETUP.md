# Supabase Vault Setup for Giphy API Key

## 🔧 Setting Up Giphy API Key in Supabase Vault

Since your Giphy API key is stored in Supabase Vault, we need to handle the correct schema. The service now automatically tries different column names.

### **Step 1: Check Your Vault Schema**

First, run this diagnostic SQL in your Supabase SQL Editor to see the actual schema:

```sql
-- Check the actual columns in vault.secrets table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'vault' AND table_name = 'secrets'
ORDER BY ordinal_position;

-- Check if giphy_api_key secret exists
SELECT name, created_at
FROM vault.secrets
WHERE name = 'giphy_api_key';
```

### **Step 2: Verify Your Giphy API Key in Vault**

1. **Go to Supabase Dashboard**
2. **Navigate to Settings → Vault**
3. **Check that you have a secret named `giphy_api_key`**
4. **Verify the value is your actual Giphy API key**

### **Step 3: Automatic Schema Detection**

The updated service automatically tries different column names:
- ✅ **`secret`** column (most common)
- ✅ **`content`** column (alternative)
- ✅ **`data`** column (alternative)
- ✅ **Environment variable** as fallback
- ✅ **Sample GIFs** as final fallback

### **Step 4: Test the Setup**

1. **Restart your app**
2. **Check console logs** for any schema detection messages
3. **Test emoji/GIF picker** functionality

### **Step 5: Alternative Setup Methods**

#### **Option A: Use Environment Variable (Easiest)**
1. **Create `.env` file**: `cp env.example .env`
2. **Add your API key**: `EXPO_PUBLIC_GIPHY_API_KEY=your_actual_key`
3. **Restart the app**

#### **Option B: Use Supabase Vault (More Secure)**
1. **Ensure your API key is in vault** with name `giphy_api_key`
2. **Run the diagnostic SQL** to verify schema
3. **Restart the app**

## **Current Status**

✅ **Updated Service**: Automatically detects vault schema
✅ **Multiple Fallbacks**: Environment variable → Vault → Sample GIFs
✅ **Better Error Handling**: No more crashes, graceful degradation
✅ **Schema Flexibility**: Works with different vault configurations

## **Troubleshooting**

### **If vault access doesn't work:**
1. **Run the diagnostic SQL** to check your schema
2. **Verify the secret exists** with name `giphy_api_key`
3. **Check console logs** for schema detection messages
4. **Use environment variable** as backup

### **If still getting errors:**
1. **Use environment variable method** (most reliable)
2. **Check Supabase connection** is working
3. **Verify RLS policies** allow vault access

## **Next Steps**

1. **Run the diagnostic SQL** to check your vault schema
2. **Verify your API key** is in vault with name `giphy_api_key`
3. **Restart the app**
4. **Test emoji/GIF picker**

The service will now automatically work with your Supabase Vault setup! 🎉 