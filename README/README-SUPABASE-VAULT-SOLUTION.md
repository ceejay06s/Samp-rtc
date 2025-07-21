# Supabase Vault Access Solution

## 🔧 Why Direct Vault Access Doesn't Work

The error `relation "public.vault.secrets" does not exist` occurs because:

### **Supabase Vault Limitations**
- ❌ **No direct client access**: Vault secrets cannot be accessed directly from client-side code
- ❌ **Security restriction**: Vault is designed to prevent client-side access to sensitive data
- ❌ **Server-side only**: Vault access requires server-side implementation

## ✅ **Recommended Solutions**

### **Option 1: Environment Variables (Recommended)**

This is the **easiest and most reliable** approach for client-side apps:

1. **Create `.env` file**:
   ```bash
   cp env.example .env
   ```

2. **Add your Giphy API key**:
   ```bash
   EXPO_PUBLIC_GIPHY_API_KEY=your_actual_giphy_api_key_here
   ```

3. **Restart your app**

### **Option 2: Server-Side Function (Advanced)**

If you need to use Supabase Vault, create a server-side function:

1. **Create Edge Function** in Supabase:
   ```typescript
   // supabase/functions/get-giphy-key/index.ts
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   serve(async (req) => {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )

     const { data, error } = await supabase.rpc('get_secret', {
       secret_name: 'giphy_api_key'
     })

     if (error) {
       return new Response(JSON.stringify({ error: error.message }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' }
       })
     }

     return new Response(JSON.stringify({ api_key: data }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

2. **Update client service** to call the function:
   ```typescript
   // In emojiGifService.ts
   const getVaultKey = async () => {
     const { data, error } = await supabase.functions.invoke('get-giphy-key')
     if (!error && data?.api_key) {
       return data.api_key
     }
     return null
   }
   ```

### **Option 3: Use Sample GIFs (No Setup Required)**

The app includes sample GIFs that work without any API key:
- ✅ **Immediate functionality**
- ✅ **No configuration needed**
- ✅ **All features work**

## **Current Status**

✅ **Error Fixed**: No more vault access errors
✅ **Graceful Fallback**: Uses sample GIFs when API key unavailable
✅ **Multiple Options**: Choose your preferred approach
✅ **Better UX**: App continues to work regardless of setup

## **Quick Fix**

For immediate resolution:

1. **Use environment variables** (easiest)
2. **Or use sample GIFs** (no setup needed)
3. **Restart your app**

## **Why This Happened**

- **Supabase Vault** is designed for server-side access only
- **Client-side apps** should use environment variables for API keys
- **Direct queries** to vault tables are not allowed for security reasons

## **Next Steps**

1. **Choose your preferred method** (environment variables recommended)
2. **Set up your API key** using the chosen method
3. **Restart your app**
4. **Test emoji/GIF picker**

The error is now resolved and you have multiple working options! 🎉 