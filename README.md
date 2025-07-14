# Dating App - React Native with Expo

A modern dating app built with React Native, Expo, and Supabase, featuring progressive match levels, voice calls, and intelligent matching algorithms.

## 🚀 Features

### Core Features
- **Progressive Match Levels**: 4-level system with increasing features
  - Level 1: Basic text messaging
  - Level 2: Photo sharing
  - Level 3: Voice messages
  - Level 4: Voice calls
- **Smart Matching**: Interest-based matching with compatibility scoring
- **Real-time Messaging**: Live chat with Supabase real-time subscriptions
- **Voice Calls**: Integrated voice calling using expo-av
- **Cross-platform**: iOS, Android, and Web support

### User Experience
- **Swipe Interface**: Intuitive card-based discovery
- **Profile Management**: Rich profiles with photos, interests, and preferences
- **Match Discovery**: Location and preference-based matching
- **Conversation Management**: Organized chat interface with match levels
- **Voice Integration**: Seamless voice messaging and calling

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Voice Calls**: expo-av
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet with theme system

### Project Structure
```
src/
├── components/
│   └── ui/           # Reusable UI components
├── services/         # API and external services
├── types/           # TypeScript type definitions
├── utils/           # Utilities and helpers
└── hooks/           # Custom React hooks

app/                 # Expo Router screens
├── _layout.tsx     # Root layout
├── index.tsx       # Entry point
├── auth.tsx        # Authentication
├── dashboard.tsx   # Main dashboard
├── discover.tsx    # Profile discovery
├── matches.tsx     # Match management
└── messages.tsx    # Chat interface

lib/                # Core libraries
├── supabase.ts     # Supabase client
├── auth.ts         # Authentication service
└── config.ts       # Configuration
```

## 🎨 Design System

### Theme System
- **Colors**: Consistent color palette with light/dark themes
- **Typography**: Responsive font sizes and weights
- **Spacing**: Standardized spacing system
- **Components**: Reusable UI components with consistent styling

### UI Components
- **Button**: Multiple variants (primary, secondary, outline, danger)
- **Input**: Form inputs with validation and error states
- **Card**: Flexible card component with shadow and border radius
- **Responsive**: Cross-platform responsive design

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd samp-rtc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Create the following tables in your Supabase database:

   ```sql
   -- Users table (handled by Supabase Auth)
   -- Profiles table
   CREATE TABLE profiles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     bio TEXT,
     age INTEGER NOT NULL,
     gender TEXT NOT NULL,
     location TEXT,
     latitude DECIMAL,
     longitude DECIMAL,
     photos TEXT[],
     interests TEXT[],
     looking_for TEXT[],
     max_distance INTEGER DEFAULT 50,
     min_age INTEGER DEFAULT 18,
     max_age INTEGER DEFAULT 100,
     is_online BOOLEAN DEFAULT false,
     last_seen TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Matches table
   CREATE TABLE matches (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     level INTEGER DEFAULT 1,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Conversations table
   CREATE TABLE conversations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
     last_message_id UUID,
     unread_count INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Messages table
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     message_type TEXT DEFAULT 'text',
     is_read BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Voice calls table
   CREATE TABLE voice_calls (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
     caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     status TEXT DEFAULT 'initiated',
     start_time TIMESTAMP WITH TIME ZONE,
     end_time TIMESTAMP WITH TIME ZONE,
     duration INTEGER,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Likes table
   CREATE TABLE likes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     liker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     liked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     is_super_like BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Row Level Security (RLS)**
   
   Enable RLS and create policies for data protection:

   ```sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
   ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

   -- Example policies (customize based on your needs)
   CREATE POLICY "Users can view their own profile" ON profiles
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can update their own profile" ON profiles
     FOR UPDATE USING (auth.uid() = user_id);
   ```

6. **Run the app**
   ```bash
   npm start
   ```

## 📱 Usage

### Authentication
- Sign up with email and basic profile information
- Sign in with existing credentials
- Password reset functionality

### Discovery
- Swipe through potential matches
- Like, pass, or super like profiles
- View detailed profile information
- See compatibility scores

### Matching
- View all your matches
- See match levels and progression
- Start conversations
- Initiate voice calls (Level 4+)

### Messaging
- Text messaging (Level 1+)
- Photo sharing (Level 2+)
- Voice messages (Level 3+)
- Voice calls (Level 4+)

## 🔒 Security

### Data Protection
- Row Level Security (RLS) on all database tables
- User authentication with Supabase Auth
- Input validation on client and server
- Secure API endpoints

### Privacy Features
- User control over profile visibility
- Match level progression for gradual trust building
- Secure messaging with read receipts
- Call history and privacy controls

## 🚀 Deployment

### Expo Build
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for Web
expo build:web
```

### Environment Variables
Ensure all environment variables are set in your deployment platform:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Features

- **Video Calls**: Enhanced calling features
- **AI Matching**: Machine learning-based recommendations
- **Social Features**: Group events and activities
- **Premium Features**: Advanced filters and unlimited likes
- **Analytics**: User behavior insights and matching analytics 