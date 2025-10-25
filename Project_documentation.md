# Bro - AI Browser Automation Assistant

## Complete Technical Documentation

### Executive Summary

**Bro** is a production-ready mobile application that enables users to automate browser tasks through voice or text commands. Built with React Native (Expo), it leverages AI for intelligent task execution and Supabase for backend services.

### Core Value Proposition

- **Voice-First Interface**: Natural language commands via voice or text
- **AI-Powered Automation**: Intelligent browser task execution
- **Freemium Model**: Free tier (1 task/3 days) + Premium (unlimited)
- **Cross-Platform**: iOS, Android, and Web support
- **Enterprise-Grade**: Secure, scalable, type-safe architecture

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native + Expo 53 | Cross-platform mobile framework |
| **State Management** | React Query + Context API | Server state + global state |
| **Backend** | Supabase | Auth, Database, RLS |
| **AI Services** | Rork Toolkit SDK | AI agent + voice transcription |
| **Type Safety** | TypeScript + Zod | Compile-time + runtime validation |
| **Audio** | Expo AV + Web Audio API | Voice recording |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                    │
├─────────────────────────────────────────────────────────┤
│  UI Layer                                                │
│  ├── Auth Screens (Login/Signup)                        │
│  ├── Chat Interface (Voice + Text)                      │
│  ├── Task History                                        │
│  └── Settings                                            │
├─────────────────────────────────────────────────────────┤
│  State Management                                        │
│  ├── AuthContext (User session)                         │
│  ├── UsageContext (Tier limits)                         │
│  └── React Query (Server state)                         │
├─────────────────────────────────────────────────────────┤
│  Services Layer                                          │
│  ├── Browser Agent (AI tools)                           │
│  ├── Voice Service (STT)                                │
│  └── Supabase Client                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
├─────────────────────────────────────────────────────────┤
│  Supabase                                                │
│  ├── PostgreSQL (profiles, tasks, usage)                │
│  ├── Auth (JWT sessions)                                │
│  └── RLS (Row-level security)                           │
├─────────────────────────────────────────────────────────┤
│  Rork Toolkit APIs                                       │
│  ├── AI Agent (Browser automation)                      │
│  └── STT (Speech-to-text)                               │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Implementation

### 1. Authentication System

**Files**: `contexts/AuthContext.tsx`, `app/auth/login.tsx`, `app/auth/signup.tsx`

**Flow**:
1. User enters credentials
2. Supabase Auth validates and creates session
3. Database trigger creates profile record
4. Session persisted in AsyncStorage
5. App redirects to main interface

**Security**:
- Passwords hashed by Supabase
- JWT tokens for session management
- Row-level security on all tables
- Auto-refresh tokens

### 2. Voice Input System

**Files**: `services/voiceService.ts`

**Platform-Specific Implementation**:

**Mobile (iOS/Android)**:
```typescript
- Uses expo-av for recording
- Outputs .wav (iOS) or .m4a (Android)
- Requests microphone permissions
- Handles audio mode switching
```

**Web**:
```typescript
- Uses MediaRecorder API
- Outputs .webm format
- Requests getUserMedia permissions
- Manages audio stream lifecycle
```

**Transcription**:
- Sends audio to Rork STT API
- Supports multiple formats
- Auto-detects language
- Returns plain text

### 3. AI Browser Agent

**Files**: `services/browserAgent.ts`

**Available Tools**:

| Tool | Description | Parameters |
|------|-------------|------------|
| searchWeb | Search the internet | query, numResults |
| navigateToUrl | Navigate to URL | url |
| fillForm | Fill web forms | formData, submitForm |
| clickElement | Click elements | selector |
| extractData | Extract page data | dataType, selector |
| takeScreenshot | Capture screenshots | fullPage, selector |
| scrollPage | Scroll pages | direction, amount |
| waitForElement | Wait for elements | selector, timeout |

**Execution Flow**:
1. User sends command
2. AI agent analyzes intent
3. Selects appropriate tool(s)
4. Executes tool with parameters
5. Returns structured results
6. Displays in chat interface

### 4. Usage Tracking System

**Files**: `contexts/UsageContext.tsx`

**Free Tier Logic**:
```typescript
- Limit: 1 task per 3 days
- Tracks: tasks_used, reset_date
- Auto-resets after 3 days
- Blocks tasks when limit reached
```

**Premium Tier**:
```typescript
- Unlimited tasks
- No reset tracking
- Priority support (future)
```

**Database Schema**:
```sql
usage_tracking {
  id: UUID
  user_id: UUID (FK)
  tasks_used: INTEGER
  last_task_date: TIMESTAMP
  reset_date: TIMESTAMP
}
```

---

## Database Schema

### Tables

#### profiles
```sql
- id: UUID (PK, FK to auth.users)
- email: TEXT
- subscription_tier: ENUM('free', 'premium')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### browser_tasks
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- task_description: TEXT
- task_type: TEXT
- status: ENUM('pending', 'processing', 'completed', 'failed')
- result: JSONB
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

#### usage_tracking
```sql
- id: UUID (PK)
- user_id: UUID (FK, UNIQUE)
- tasks_used: INTEGER
- last_task_date: TIMESTAMP
- reset_date: TIMESTAMP
- created_at: TIMESTAMP
```

### Row-Level Security Policies

All tables have RLS enabled with policies:
- Users can only view/edit their own data
- Enforced at database level
- No application-level bypass possible

---

## Code Organization

### Context Pattern

Using `@nkzw/create-context-hook` for type-safe contexts:

```typescript
export const [Provider, useHook] = createContextHook(() => {
  // State and logic
  return useMemo(() => ({
    // Exposed API
  }), [dependencies]);
});
```

**Benefits**:
- Automatic TypeScript inference
- No boilerplate
- Memoization built-in
- Clean API

### Service Pattern

Encapsulated business logic:

```typescript
class VoiceService {
  async requestPermissions(): Promise<boolean>
  async startRecording(): Promise<void>
  async stopRecording(): Promise<AudioData>
  async transcribeAudio(data: AudioData): Promise<string>
}
```

**Benefits**:
- Testable
- Reusable
- Platform-agnostic interface
- Clear responsibilities

---

## Performance Optimizations

### React Optimizations

1. **Memoization**:
   - `useMemo()` for computed values
   - `useCallback()` for stable functions
   - `React.memo()` for expensive components

2. **Efficient Re-renders**:
   - Context split by concern
   - Selective subscriptions
   - Optimistic updates

3. **List Rendering**:
   - FlatList for long lists
   - keyExtractor optimization
   - Item memoization

### Network Optimizations

1. **React Query**:
   - Automatic caching
   - Background refetching
   - Stale-while-revalidate

2. **Supabase**:
   - Connection pooling
   - Prepared statements
   - Indexed queries

---

## Security Considerations

### Authentication
- Secure password hashing (bcrypt)
- JWT with expiration
- Refresh token rotation
- Session invalidation on logout

### Data Protection
- RLS on all tables
- No direct table access
- Parameterized queries
- Input validation (Zod)

### API Security
- Environment variables for keys
- No secrets in code
- HTTPS only
- Rate limiting (Supabase)

---

## Testing Strategy

### Unit Tests
```typescript
// Context logic
test('incrementUsage blocks when limit reached')
test('usage resets after 3 days')

// Services
test('voice transcription handles errors')
test('browser agent selects correct tool')
```

### Integration Tests
```typescript
// Auth flow
test('user can sign up and login')
test('session persists across app restarts')

// Task execution
test('voice command creates task')
test('task appears in history')
```

### E2E Tests
```typescript
// Full user journey
test('new user completes first task')
test('free user hits limit and upgrades')
```

---

## Deployment Guide

### Prerequisites
1. Supabase project with tables created
2. Environment variables configured
3. Expo account (for builds)

### Development
```bash
bun install
bun start
```

### Production Build

**iOS**:
```bash
eas build --platform ios
eas submit --platform ios
```

**Android**:
```bash
eas build --platform android
eas submit --platform android
```

**Web**:
```bash
expo export:web
# Deploy to Vercel/Netlify
```

---

## Monitoring & Analytics

### Recommended Tools

1. **Sentry**: Error tracking
2. **Mixpanel**: User analytics
3. **Supabase Dashboard**: Database metrics
4. **Expo Analytics**: App performance

### Key Metrics

- Daily Active Users (DAU)
- Task completion rate
- Voice vs text input ratio
- Free to premium conversion
- Average tasks per user
- Error rates by feature

---

## Future Roadmap

### Phase 1 (MVP) ✅
- [x] Authentication
- [x] Voice input
- [x] AI browser agent
- [x] Usage tracking
- [x] Task history

### Phase 2 (Growth)
- [ ] Payment integration (Stripe)
- [ ] Push notifications
- [ ] Task templates
- [ ] Sharing capabilities
- [ ] Advanced analytics

### Phase 3 (Scale)
- [ ] Team accounts
- [ ] API access
- [ ] Custom tools
- [ ] Webhooks
- [ ] Enterprise features

---

## Troubleshooting

### Common Issues

**Issue**: Voice recording fails on iOS
**Solution**: Check Info.plist has microphone permission

**Issue**: Supabase connection timeout
**Solution**: Verify environment variables and network

**Issue**: Tasks not saving to history
**Solution**: Check RLS policies and user authentication

---

## Contributing Guidelines

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Test coverage > 80%

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description
5. Pass CI checks
6. Code review approval

---

## License & Credits

**License**: MIT

**Built With**:
- Expo Team
- Supabase Team
- Rork Toolkit
- React Native Community

---

## Contact & Support

For technical questions or issues:
1. Check this documentation
2. Review SUPABASE_SETUP.md
3. Check GitHub issues
4. Contact support team

**Version**: 1.0.0
**Last Updated**: 2025-01-08
