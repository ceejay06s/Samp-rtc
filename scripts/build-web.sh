#!/bin/bash

# Load environment variables from .env file (if it exists)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "Environment variables loaded from .env file"
fi

echo "Building web export with embedded environment variables..."
echo "Note: Environment variables are now embedded in app.json for static builds"

# Build the web export
npx expo export --platform web

echo "Build completed successfully!"
echo "You can now deploy using: eas deploy --prod"
echo ""
echo "Or if you want to deploy immediately, uncomment the line below:"
echo "# eas deploy --prod"
