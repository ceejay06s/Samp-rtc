# Telegram Sticker Crawler Edge Function

A Supabase Edge Function that crawls Telegram sticker packs from tlgrm.eu and uploads them to Supabase Storage with proper animated image detection and metadata.

## ✨ Features

### 🎬 Animated Image Detection
- **WebP Animation Detection**: Automatically detects animated WebP files by analyzing RIFF chunks and ANIM/ANMF data
- **GIF Animation Detection**: Identifies animated GIFs by parsing image descriptors and extension blocks
- **TGS Support**: Handles Telegram's proprietary TGS sticker format
- **Multiple Formats**: Supports WebP, GIF, PNG, JPEG, and TGS formats

### 🚀 Enhanced Functionality
- **Automatic Bucket Creation**: Creates storage bucket if it doesn't exist
- **Rich Metadata**: Stores file size, upload timestamp, animation status, and original URL
- **Content Type Detection**: Automatically sets correct MIME types for all supported formats
- **Error Handling**: Comprehensive error handling with detailed logging
- **Rate Limiting**: Built-in timeout protection (30 seconds)
- **Input Validation**: Sanitizes and validates shortname input

### 📊 Detailed Reporting
- **Upload Statistics**: Total found vs. uploaded count
- **Animation Count**: Number of animated images detected
- **File Details**: Individual file information including size and format
- **Comprehensive Logging**: Detailed console logs for debugging

## 🛠️ Setup

### 1. Environment Variables
Set these environment variables in your Supabase project:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET=telegram-stickers  # Optional, defaults to "telegram-stickers"
```

### 2. Deploy the Function
```bash
supabase functions deploy telegram-sticker-crawler
```

### 3. Storage Bucket
The function will automatically create the storage bucket with:
- **Privacy**: Private (not public)
- **File Size Limit**: 10MB per file
- **Allowed MIME Types**: WebP, GIF, PNG, JPEG, TGS

## 📱 Usage

### API Endpoint
```
POST /functions/v1/telegram-sticker-crawler
```

### Request Body
```json
{
  "shortname": "cattos"
}
```

### Response Format
```json
{
  "message": "✅ Uploaded 20/20 stickers from cattos",
  "total": 20,
  "uploaded": 20,
  "animated": 8,
  "details": [
    {
      "filename": "cattos/sticker_1.webp",
      "isAnimated": true,
      "contentType": "image/webp",
      "size": 45678
    }
  ]
}
```

## 🔍 How It Works

### 1. Input Validation
- Validates shortname format (alphanumeric, hyphens, underscores only)
- Ensures proper JSON request body

### 2. Page Crawling
- Fetches sticker pack page from tlgrm.eu
- Parses HTML to find all sticker images
- Uses proper User-Agent headers

### 3. Image Analysis
- Downloads each image for analysis
- Detects file format and animation status
- Determines proper content type

### 4. Storage Upload
- Creates organized folder structure: `{shortname}/sticker_{index}.{ext}`
- Uploads with rich metadata
- Handles errors gracefully

### 5. Animation Detection

#### WebP Animation
```typescript
// Looks for ANIM chunk (animation info)
// Looks for ANMF chunks (animated frames)
// Analyzes RIFF structure for animation data
```

#### GIF Animation
```typescript
// Counts image descriptors
// Looks for Graphics Control Extensions
// Determines if multiple frames exist
```

## 🧪 Testing

### Run Test Script
```bash
cd supabase/functions/telegram-sticker-crawler
deno run --allow-net --allow-env test.ts
```

### Test Cases
- `cattos` - Popular cat stickers
- `doge` - Doge memes
- `pepe` - Pepe the Frog
- `anime` - Anime characters

## 📁 File Structure

```
telegram-sticker-crawler/
├── index.ts          # Main function
├── test.ts           # Test script
├── README.md         # This file
└── .gitignore        # Git ignore file
```

## 🔧 Configuration

### Bucket Settings
- **Name**: `telegram-stickers` (configurable via env var)
- **Privacy**: Private
- **File Size Limit**: 10MB
- **Allowed Types**: WebP, GIF, PNG, JPEG, TGS

### Timeout Settings
- **Page Fetch**: 30 seconds
- **Individual Downloads**: No timeout (relies on fetch defaults)

## 🚨 Error Handling

### Common Errors
- **400**: Invalid shortname or request format
- **404**: Sticker pack not found
- **405**: Wrong HTTP method
- **500**: Internal server error

### Error Logging
All errors are logged with context:
```typescript
console.error(`Error processing sticker ${idx + 1}:`, e);
console.warn(`Invalid src attribute for sticker ${idx + 1}:`, src);
```

## 📈 Performance

### Optimizations
- **Parallel Processing**: Downloads and uploads stickers concurrently
- **Efficient Parsing**: Uses DOMParser for fast HTML parsing
- **Memory Management**: Processes files as ArrayBuffer for efficiency

### Limitations
- **Rate Limiting**: Built-in delays between requests
- **File Size**: 10MB per file limit
- **Concurrent Uploads**: All stickers processed simultaneously

## 🔒 Security

### Input Sanitization
- Shortname validation (alphanumeric only)
- URL encoding for external requests
- No path traversal vulnerabilities

### Access Control
- Requires Supabase authentication
- Uses service role key for storage operations
- Private bucket by default

## 🚀 Deployment

### Supabase CLI
```bash
supabase functions deploy telegram-sticker-crawler
```

### Manual Deployment
1. Copy `index.ts` to your Supabase project
2. Set environment variables
3. Deploy via Supabase dashboard

## 📝 Changelog

### v2.0.0 - Enhanced Animation Support
- ✅ Added animated WebP detection
- ✅ Added animated GIF detection
- ✅ Improved error handling and logging
- ✅ Added automatic bucket creation
- ✅ Enhanced metadata storage
- ✅ Better input validation
- ✅ Comprehensive testing support

### v1.0.0 - Initial Release
- Basic sticker crawling
- WebP and TGS support
- Simple storage upload

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the error logs in Supabase dashboard
2. Verify environment variables are set correctly
3. Test with the provided test script
4. Open an issue in the repository

---

**Note**: This function requires a Supabase project with Edge Functions enabled and proper storage permissions configured. 