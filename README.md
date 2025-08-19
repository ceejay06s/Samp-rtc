# Samp-rtc - React Native Dating App

A modern React Native dating app built with Expo, featuring real-time messaging, voice calls, and intelligent matching algorithms.

## 📚 **Documentation**

All documentation has been organized in the `README/` folder for better navigation:

- **[📋 Documentation Index](./README/README-INDEX.md)** - Complete index of all documentation files
- **[🔧 Setup & Configuration](./README/README-INDEX.md#-setup--configuration)** - API setup, database configuration
- **[🐛 Bug Fixes & Error Resolution](./README/README-INDEX.md#-bug-fixes--error-resolution)** - Common issues and solutions
- **[💬 Chat & Messaging](./README/README-INDEX.md#-chat--messaging)** - Real-time communication features
- **[🎯 Matching & Discovery](./README/README-INDEX.md#-matching--discovery)** - User matching and discovery features
- **[📱 UI/UX & Mobile](./README/README-INDEX.md#-uiux--mobile)** - Mobile optimization and gestures
- **[📝 Content & Posts](./README/README-INDEX.md#-content--posts)** - Posts and content management
- **[🔍 Location & Auto Features](./README/README-INDEX.md#-location--auto-features)** - Location-based features
- **[💰 Billing & Plans](./README/README-INDEX.md#-billing--plans)** - Subscription and billing features
- **[🎨 Features & Integrations](./README/README-INDEX.md#-features--integrations)** - Additional features and integrations

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Supabase account
- Giphy API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Samp-rtc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## 🔧 **Configuration**

### Required Environment Variables

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Giphy API for GIF features
EXPO_PUBLIC_GIPHY_API_KEY=your_giphy_api_key
```

### Database Setup

1. **Set up Supabase project**
2. **Run database migrations** (see SQL files in `sql/` folder)
3. **Configure storage buckets** (see [Storage Setup](./README-STORAGE-SETUP.md))
4. **Set up authentication** (see [User Management](./README-INDEX.md#authentication--user-management))

## 📱 **Features**

### Core Features
- ✅ **User Authentication** - Secure signup/login with Supabase Auth
- ✅ **Profile Management** - Photo uploads, bio editing, preferences
- ✅ **Smart Matching** - Location-based matching with filters
- ✅ **Real-time Chat** - Instant messaging with typing indicators
- ✅ **Voice Calls** - WebRTC-based voice communication
- ✅ **Posts & Comments** - Social media-style content sharing
- ✅ **Emoji & GIF Support** - Rich media in conversations

### Advanced Features
- ✅ **Cross-platform** - iOS, Android, and Web support
- ✅ **Responsive Design** - Adaptive layouts for all screen sizes
- ✅ **Offline Support** - Basic functionality without internet
- ✅ **Push Notifications** - Real-time alerts for matches and messages
- ✅ **Analytics** - User behavior tracking and insights

## 🏗️ **Architecture**

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Context** for state management

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** for data storage
- **Real-time subscriptions** for live updates
- **Storage buckets** for media files

### Communication
- **WebRTC** for peer-to-peer voice calls
- **Supabase Realtime** for messaging
- **Giphy API** for GIF integration

## 🐛 **Troubleshooting**

### Common Issues

1. **Giphy API Errors** - See [Giphy Setup Guide](./README-GIPHY-SETUP.md)
2. **Database Connection** - Check [Database Fixes](./README-INDEX.md#database-issues)
3. **Authentication Issues** - Review [User Management](./README-INDEX.md#authentication--user-management)
4. **Real-time Features** - Check [Chat Documentation](./README-INDEX.md#-chat--messaging)

### Getting Help

1. **Check the documentation index** - [README-INDEX.md](./README-INDEX.md)
2. **Search for specific issues** in the organized documentation
3. **Review recent fixes** in the [Recent Updates](./README-INDEX.md#-recent-updates) section

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- **Expo** for the amazing development platform
- **Supabase** for the powerful backend services
- **React Native** community for the excellent ecosystem
- **Giphy** for the GIF API integration

---

*For detailed documentation, see the [Documentation Index](./README-INDEX.md) in the README folder.* 