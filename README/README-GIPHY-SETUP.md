# Giphy API Setup for Sticker Picker

## 🎯 What We Built

The sticker picker now has **three distinct subtabs** with **full Giphy API integration**:

1. **EMOJI** → Native emoji picker with categories
2. **GIF** → **Full Giphy API integration** with multiple categories
3. **STICKERS** → Your Telegram stickers from Supabase storage

## 🚀 Giphy API Setup

### Step 1: Get Your API Key

1. Go to [Giphy Developers](https://developers.giphy.com/)
2. Sign up for a **free account**
3. Create a new app
4. Copy your **API Key**

### Step 2: Add to Environment Variables

Add this to your `.env` file:

```bash
EXPO_PUBLIC_GIPHY_API_KEY=your_actual_giphy_api_key_here
```

**Example:**
```bash
EXPO_PUBLIC_GIPHY_API_KEY=K561QAO7slfK8l7zgjVLLCP6b5Fg9Wki
```

### Step 3: Restart Your App

```bash
npx expo start --clear
```

## 🎨 Enhanced GIF Features

### GIF Categories Available:
- **Recent** → Latest trending GIFs
- **Popular** → Most popular GIFs
- **Trending** → Currently trending GIFs
- **Random** → Random funny GIFs
- **Funny** → Humor category GIFs
- **Cute** → Cute and adorable GIFs
- **Reactions** → Reaction GIFs

### Smart Search:
- **Type anything** in the search bar
- **Real-time results** from Giphy
- **WebP format** for better performance
- **G-rated content** only

## 🔧 Technical Features

### Giphy Service (`src/services/giphyService.ts`)
- **API Key Validation**: Checks if API key is configured
- **Multiple Endpoints**: Search, trending, categories, random
- **Error Handling**: Graceful fallbacks for API failures
- **Rate Limiting**: Smart limits to avoid API restrictions
- **Content Filtering**: G-rated content only

### Integration Points
- **Dynamic Categories**: Bottom subtabs change based on GIF selection
- **Smart Search**: Automatically detects GIF vs Sticker mode
- **Loading States**: Shows loading indicators during API calls
- **Error Messages**: Clear feedback when things go wrong

## 🎯 Usage Examples

### Browse GIF Categories:
1. Click **GIF** tab
2. See categories: Recent, Popular, Trending, Random, Funny, Cute, Reactions
3. Click any category to load GIFs
4. Scroll through results

### Search for Specific GIFs:
1. Click **GIF** tab
2. Type search query (e.g., "cat", "dance", "laugh")
3. Press search or Enter
4. See real-time results from Giphy

### Use GIFs in Chat:
1. Select any GIF from results
2. GIF automatically converts to sticker format
3. Use in your chat system

## 🚨 Important Notes

- **API Limits**: Giphy free tier has rate limits (1000 requests/day)
- **Content Rating**: All GIFs filtered to "G" rating
- **Performance**: GIFs optimized with WebP format
- **Offline**: Requires internet connection for GIFs
- **Caching**: Results cached for better performance

## 🐛 Troubleshooting

### "Giphy API not configured" Error
```bash
# Check your .env file has:
EXPO_PUBLIC_GIPHY_API_KEY=your_actual_key_here

# Restart app:
npx expo start --clear
```

### "No GIFs found" Error
- Verify your Giphy API key is correct
- Check internet connection
- Verify API rate limits haven't been exceeded
- Try a different search term

### Slow GIF Loading
- Reduce search limit (default: 50)
- Check network speed
- Consider upgrading Giphy plan for higher limits

### API Rate Limiting
- Free tier: 1000 requests/day
- Paid tiers: Higher limits available
- Random GIFs limited to 10 per request

## 🔮 Advanced Features

### Custom GIF Categories:
```typescript
// Add custom categories in giphyService.ts
static getPopularCategories(): string[] {
  return ['Recent', 'Popular', 'Trending', 'Random', 'Funny', 'Cute', 'Reactions', 'Your Custom Category'];
}
```

### Custom Search Tags:
```typescript
// Modify search queries in handleGifCategorySelect
case 'Funny':
  gifs = await GiphyService.getGifsByCategory('funny memes', 50);
  break;
```

### Performance Optimization:
```typescript
// Adjust limits based on device performance
const limit = isDesktop ? 100 : 50;
const gifs = await GiphyService.getTrendingGifs(limit);
```

## 📱 Platform Support

- **iOS**: Full GIF support with WebP optimization
- **Android**: Full GIF support with WebP optimization  
- **Web**: Full GIF support with WebP optimization
- **All**: Real-time Giphy API integration

## 🔒 Security & Privacy

- **API Key**: Stored in environment variables (not in code)
- **Content Filtering**: G-rated content only
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: No sensitive data in error messages

---

## 🎉 You're All Set!

Now you have a **professional sticker picker** with:
- ✅ **Full Giphy API integration**
- ✅ **7 GIF categories** with real-time content
- ✅ **Smart search** functionality
- ✅ **Professional UI** like top messaging apps
- ✅ **Error handling** and user feedback

**Need Help?** Check the console for detailed error messages and API responses. 