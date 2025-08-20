#!/bin/bash

# Deploy Audio Upload Edge Function
# This script deploys the upload-audio Edge Function to Supabase

echo "🎤 Deploying Audio Upload Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/upload-audio/index.ts" ]; then
    echo "❌ upload-audio Edge Function not found."
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Make sure your environment variables are set."
fi

echo "📁 Current directory: $(pwd)"
echo "🔧 Deploying upload-audio function..."

# Deploy the function
npx supabase functions deploy upload-audio

if [ $? -eq 0 ]; then
    echo "✅ Audio upload Edge Function deployed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Test voice message functionality in the app"
    echo "2. Check Edge Function logs in Supabase dashboard"
    echo "3. Verify the function is active in Edge Functions section"
    echo ""
    echo "📚 For more information, see: README/README-EDGE-FUNCTION-AUDIO-UPLOAD.md"
else
    echo "❌ Failed to deploy Edge Function"
    echo "Check the error messages above and try again."
    exit 1
fi
