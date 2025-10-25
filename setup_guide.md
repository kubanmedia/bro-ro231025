# Complete Setup Guide for Bro - AI Browser Assistant

## Quick Start (5 minutes)

### Step 1: Clone and Install
```bash
# Install dependencies
bun install
# or
npm install
```

### Step 2: Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and set project name
   - Wait for project to be ready (~2 minutes)

2. **Run Database Migrations**
   - Open SQL Editor in Supabase Dashboard
   - Copy and paste SQL from `SUPABASE_SETUP.md`
   - Run each section (profiles, browser_tasks, usage_tracking, trigger)
   - Verify tables appear in Table Editor

3. **Get API Credentials**
   - Go to Settings > API
   - Copy "Project URL" and "anon public" key

### Step 3: Configure Environment

Create `.env` file in project root:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run the App

```bash
bun start
```

Scan QR code with Expo Go app on your phone.

---

## Detailed Setup Instructions

### Prerequisites

#### Required
- **Node.js 18+** or **Bun** (recommended)
- **Expo Go** app on iOS/Android device
- **Supabase** account (free tier works)

#### Optional
- **EAS CLI** for production builds
- **Xcode** for iOS simulator (Mac only)
- **Android Studio** for Android emulator

### Installation Steps

#### 1. Install Dependencies

```bash
# Using Bun (faster)
bun install

# Using npm
npm install

# Using yarn
yarn install
```

**Installed Packages**:
- `@supabase/supabase-js` - Supabase client
- `expo-av` - Audio recording (mobile)
- `zod` - Schema validation
- `@tanstack/react-query` - Data fetching
- `lucide-react-native` - Icons
- And more (see package.json)

#### 2. Supabase Configuration

**A. Create Tables**

Run this SQL in Supabase SQL Editor:

```sql
-- 1. Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free' 
    CHECK (subscription_tier IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Browser tasks table
CREATE TABLE browser_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE browser_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON browser_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON browser_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON browser_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Usage tracking table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  tasks_used INTEGER NOT NULL DEFAULT 0,
  last_task_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**B. Verify Setup**

1. Go to Table Editor
2. You should see: `profiles`, `browser_tasks`, `usage_tracking`
3. Check Policies tab - each table should have RLS enabled

**C. Get API Keys**

1. Settings > API
2. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - anon public key: `eyJhbGci...`

#### 3. Environment Configuration

Create `.env` in project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Never commit `.env` to git (already in .gitignore)
- See `.env.example` for template

#### 4. Run Development Server

```bash
# Start Expo dev server
bun start

# Or with specific platform
bun start --ios      # iOS simulator
bun start --android  # Android emulator
bun start --web      # Web browser
```

**Scan QR Code**:
1. Open Expo Go app on your phone
2. Scan QR code from terminal
3. App will load on your device

---

## Platform-Specific Setup

### iOS Development

#### Requirements
- macOS with Xcode installed
- iOS Simulator or physical device
- Apple Developer account (for device testing)

#### Setup
```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Run on simulator
bun start --ios
```

#### Permissions
Add to `app.json`:
```json
"ios": {
  "infoPlist": {
    "NSMicrophoneUsageDescription": "Bro needs microphone access for voice commands",
    "NSSpeechRecognitionUsageDescription": "Bro uses speech recognition"
  }
}
```

### Android Development

#### Requirements
- Android Studio installed
- Android SDK configured
- Android emulator or physical device

#### Setup
```bash
# Run on emulator
bun start --android
```

#### Permissions
Already configured in `app.json`:
```json
"android": {
  "permissions": [
    "RECORD_AUDIO",
    "INTERNET"
  ]
}
```

### Web Development

#### Setup
```bash
# Run in browser
bun start --web
```

**Note**: Voice recording uses Web Audio API (MediaRecorder)

---

## Testing the App

### 1. Create Test Account

1. Launch app
2. Click "Sign Up"
3. Enter email: `test@example.com`
4. Enter password: `test123456`
5. Click "Sign Up"
6. Go back and sign in

### 2. Test Voice Input

1. Tap microphone icon
2. Allow microphone permission
3. Speak: "Search for React Native tutorials"
4. Tap microphone again to stop
5. Wait for transcription
6. Message appears in input field

### 3. Test AI Agent

1. Type or speak: "Search for the latest news"
2. Tap send button
3. Watch AI agent process request
4. See tool calls and results
5. Check task appears in History tab

### 4. Test Usage Limits

1. Complete 1 task (free tier limit)
2. Try to send another task
3. Should see "Usage Limit Reached" alert
4. Check Settings tab for reset time

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to Supabase"
**Solutions**:
- Verify `.env` file exists and has correct values
- Check Supabase project is active (not paused)
- Ensure internet connection is working
- Try restarting dev server

#### Issue: "Microphone permission denied"
**Solutions**:
- iOS: Settings > Bro > Allow Microphone
- Android: Settings > Apps > Bro > Permissions > Microphone
- Web: Browser settings > Site permissions > Microphone

#### Issue: "Voice transcription fails"
**Solutions**:
- Check internet connection
- Verify audio is being recorded (check logs)
- Try shorter voice commands
- Ensure Rork Toolkit API is accessible

#### Issue: "Tasks not saving to history"
**Solutions**:
- Check Supabase RLS policies are set up
- Verify user is authenticated
- Check browser console for errors
- Ensure `browser_tasks` table exists

#### Issue: "App crashes on startup"
**Solutions**:
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && bun install`
- Check for TypeScript errors: `tsc --noEmit`
- Review error logs in terminal

### Debug Mode

Enable detailed logging:

```typescript
// In lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: true, // Add this
  },
});
```

---

## Production Deployment

### Prerequisites
- EAS CLI: `npm install -g eas-cli`
- Expo account
- Apple Developer account (iOS)
- Google Play Console account (Android)

### Build Configuration

Create `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
      }
    }
  }
}
```

### Build Commands

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Next Steps

After successful setup:

1. **Customize Branding**
   - Update app name in `app.json`
   - Replace icon images in `assets/images/`
   - Modify color scheme in components

2. **Add Features**
   - Implement payment integration
   - Add push notifications
   - Create task templates
   - Build analytics dashboard

3. **Optimize Performance**
   - Enable Hermes engine
   - Implement code splitting
   - Add image optimization
   - Configure caching strategies

4. **Security Hardening**
   - Enable 2FA for Supabase
   - Add rate limiting
   - Implement request signing
   - Set up monitoring

---

## Support Resources

- **Documentation**: See `PROJECT_DOCUMENTATION.md`
- **Database Setup**: See `SUPABASE_SETUP.md`
- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **React Native Docs**: https://reactnative.dev

---

## Checklist

Before launching:

- [ ] Supabase tables created
- [ ] RLS policies enabled
- [ ] Environment variables set
- [ ] App runs on device
- [ ] Voice input works
- [ ] AI agent responds
- [ ] Tasks save to history
- [ ] Usage limits enforced
- [ ] Authentication works
- [ ] Error handling tested

---

**Setup Complete!** 🎉

You now have a fully functional AI browser automation assistant. Start automating your browser tasks with voice commands!
