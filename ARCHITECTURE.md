# CertLab Architecture

This document describes the technical architecture of CertLab, including the overall system design, data flow, and key components.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Frontend Architecture](#frontend-architecture)
- [Data Layer](#data-layer)
- [Authentication](#authentication)
- [State Management](#state-management)
- [Routing](#routing)
- [Multi-Tenancy](#multi-tenancy)
- [Build and Deployment](#build-and-deployment)
- [Key Design Decisions](#key-design-decisions)

## System Overview

CertLab is a **client-side** web application designed for certification exam preparation. The application uses Google Firebase as its exclusive backend for cloud storage and authentication.

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Type** | Single-Page Application (SPA) |
| **Runtime** | Browser (Chrome, Firefox, Safari, Edge) |
| **Backend** | Google Firebase (Firestore + Auth) |
| **Local Cache** | IndexedDB for offline support |
| **Authentication** | Firebase Authentication |
| **Hosting** | Firebase Hosting |
| **Offline Support** | Local cache with automatic sync |

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         React Application                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │ │
│  │  │    Pages    │  │  Components │  │    Hooks    │  │   Context  │  │ │
│  │  │  (Routes)   │  │  (UI/Forms) │  │  (Custom)   │  │  Providers │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │ │
│  │           │              │               │                │          │ │
│  │           └──────────────┴───────────────┴────────────────┘          │ │
│  │                                   │                                   │ │
│  │                           ┌───────▼───────┐                          │ │
│  │                           │ TanStack Query│                          │ │
│  │                           │ (State Mgmt)  │                          │ │
│  │                           └───────┬───────┘                          │ │
│  │                                   │                                   │ │
│  └───────────────────────────────────┼───────────────────────────────────┘ │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐ │
│  │                     Firebase/Firestore (Cloud Backend)                 │ │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐   │ │
│  │  │ firestore-      │───▶│  Firebase SDK   │───▶│   Firestore DB   │   │ │
│  │  │ service.ts      │    │                 │    │   (Cloud)        │   │ │
│  │  └─────────────────┘    └─────────────────┘    └──────────────────┘   │ │
│  │                                   │                                     │ │
│  │                           ┌───────▼───────┐                            │ │
│  │                           │   IndexedDB   │  (Offline Cache)           │ │
│  │                           │  (Local Cache)│                            │ │
│  │                           └───────────────┘                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.6.x | Type safety |
| Vite | 5.4.x | Build tool |
| Vitest | 2.x | Unit testing |
| TailwindCSS | 3.4.x | Styling |
| Radix UI | Latest | Component primitives |
| TanStack Query | 5.x | Async state management |
| Wouter | 3.x | Client-side routing |

### Component Organization

```
client/src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (buttons, inputs, etc.)
│   ├── Header.tsx       # Navigation header
│   ├── QuizInterface.tsx# Quiz taking component
│   ├── BadgeCard.tsx    # Achievement display
│   └── ...              # Feature-specific components
├── pages/               # Route-level components
│   ├── landing.tsx      # Home/landing page
│   ├── dashboard.tsx    # User dashboard
│   ├── quiz.tsx         # Quiz taking
│   ├── results.tsx      # Quiz results
│   └── ...              # Other pages
├── hooks/               # Custom React hooks
├── test/                # Test setup and utilities
│   └── setup.ts         # Vitest test configuration
└── lib/                 # Core services
    ├── firebase.ts       # Firebase initialization
    ├── firestore-service.ts # Firestore operations
    ├── auth-provider.tsx # Auth context
    ├── indexeddb.ts      # Local cache service
    └── queryClient.ts    # Query configuration
```

## Data Layer

### Firestore Collections (Cloud Backend)

All application data is stored in Google Firebase/Firestore with the following collections:

| Store | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, passwordHash, tenantId |
| `tenants` | Multi-tenant support | id, name, isActive |
| `categories` | Certification categories | id, tenantId, name |
| `subcategories` | Topic areas | id, tenantId, categoryId |
| `questions` | Question bank | id, tenantId, text, options |
| `quizzes` | Quiz attempts | id, userId, tenantId, score |
| `userProgress` | Learning progress | userId, tenantId, categoryId |
| `masteryScores` | Performance tracking | userId, tenantId, subcategoryId |
| `badges` | Achievement definitions | id, name, requirement |
| `userBadges` | Earned badges | userId, tenantId, badgeId |
| `userGameStats` | Gamification stats | userId, tenantId, points |
| `lectures` | Study materials | id, userId, content |
| `challenges` | Learning challenges | id, userId, type |
| `challengeAttempts` | Challenge results | userId, tenantId, score |
| `studyGroups` | Study groups | id, tenantId, name |
| `studyGroupMembers` | Group membership | groupId, userId |
| `practiceTests` | Practice exams | id, tenantId, name |
| `practiceTestAttempts` | Test results | userId, tenantId, score |
| `settings` | App settings | key, value |

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Event   │────▶│ TanStack     │────▶│ Firestore    │
│  (e.g. click)│     │ Query/Mutation│     │ Service      │
└──────────────┘     └──────────────┘     │ (firestore-  │
                                          │  service.ts) │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ Firebase SDK │
                                          │ (Cloud)      │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ Firestore DB │
                                          │ (Backend)    │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ IndexedDB    │
                                          │ (Local Cache)│
                                          └──────────────┘
```

### Firestore Service Pattern

The `firestoreService` provides access to Firebase/Firestore:

```typescript
// Example usage
import { firestoreService } from '@/lib/firestore-service';

// Get all categories for current user
const categories = await firestoreService.getUserData(userId, 'categories');

// Create a new quiz
const quiz = await firestoreService.addUserData(userId, 'quizzes', {
  title: 'CISSP Practice',
  categoryIds: [1],
  subcategoryIds: [],
  questionCount: 10,
  mode: 'quiz'
});

// Query user progress
const progress = await firestoreService.queryUserData(
  userId,
  'progress',
  where('categoryId', '==', categoryId)
);
```

## Authentication

CertLab uses Firebase Authentication:

### Auth Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Register/  │────▶│  Firebase    │────▶│   User       │
│   Login Form │     │  Auth SDK    │     │   Created    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                          ┌──────▼───────┐
                                          │   Firestore  │
                                          │   User Doc   │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │   Update     │
                                          │   AuthContext│
                                          └──────────────┘
```

### Security Considerations

- Firebase Auth handles password hashing and secure storage
- Session managed by Firebase (refresh tokens, expiration)
- Email/password and Google OAuth supported
- Per-user data isolation via Firestore security rules

## State Management

CertLab uses four complementary state management approaches, each suited for specific use cases.

> **For detailed guidance on when to use each approach, see [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)**

### Quick Reference

| Approach | When to Use | Example |
|----------|-------------|---------|
| **useState** | Simple local state (toggles, inputs) | Modal visibility, form inputs |
| **useReducer** | Complex local state with related updates | Quiz workflow (answers, navigation, flags) |
| **TanStack Query** | Async data from Firestore | Fetching quizzes, categories, user data |
| **React Context** | Global state shared across components | Authentication, theme |

### TanStack Query (React Query)

Used for all async data operations:

```typescript
// Query configuration (queryClient.ts)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,          // Data never considered stale
      refetchOnWindowFocus: false,  // No auto-refetch
      retry: 3,                     // Retry failed Firebase requests
    },
  },
});
```

### Query Key Patterns

Use the `queryKeys` factory from `lib/queryClient.ts`:

```typescript
import { queryKeys } from '@/lib/queryClient';

// User-specific data
queryKey: queryKeys.user.stats(userId)
queryKey: queryKeys.user.quizzes(userId)

// Resource data
queryKey: queryKeys.categories.all()
queryKey: queryKeys.quiz.detail(quizId)
```

### useReducer for Complex Workflows

The quiz-taking feature uses `useReducer` for managing complex state:

```typescript
// Quiz state managed by reducer
const [state, dispatch] = useReducer(quizReducer, initialQuizState);

// Actions describe state transitions
dispatch({ type: 'SELECT_ANSWER', payload: { questionId, answer } });
dispatch({ type: 'TOGGLE_FLAG', payload: { questionId } });
dispatch({ type: 'CHANGE_QUESTION', payload: { index } });
```

See `hooks/useQuizState.ts` and `components/quiz/quizReducer.ts` for implementation.

### Context Providers

| Context | Purpose | Location |
|---------|---------|----------|
| AuthProvider | User authentication state | auth-provider.tsx |
| ThemeProvider | Theme switching (7 themes) | theme-provider.tsx |
| QueryClientProvider | TanStack Query instance | App.tsx |
| TooltipProvider | Radix tooltip context | App.tsx |

## Routing

### Client-Side Routing with Wouter

```typescript
// Route definitions (App.tsx)
<Route path="/" component={Landing} />
<Route path="/app" component={Dashboard} />
<Route path="/app/quiz/:id" component={Quiz} />
<Route path="/app/results/:id" component={Results} />
<Route path="/app/achievements" component={Achievements} />
// ... more routes
```

### Base Path Configuration

For Firebase Hosting deployment:

```typescript
// From vite.config.ts
// Firebase Hosting uses root path
base: process.env.VITE_BASE_PATH || '/'
```

## Multi-Tenancy

CertLab supports multiple isolated environments (tenants):

### Tenant Isolation

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Account                               │
│  (email, name, credentials - shared across tenants)               │
└──────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Tenant 1      │  │   Tenant 2      │  │   Tenant 3      │
│   (Default)     │  │   (CISSP)       │  │   (CISM)        │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Categories    │  │ - Categories    │  │ - Categories    │
│ - Questions     │  │ - Questions     │  │ - Questions     │
│ - Quiz History  │  │ - Quiz History  │  │ - Quiz History  │
│ - Progress      │  │ - Progress      │  │ - Progress      │
│ - Achievements  │  │ - Achievements  │  │ - Achievements  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Switching Tenants

```typescript
// From auth-provider.tsx
const switchTenant = async (tenantId: number) => {
  const tenant = await clientStorage.getTenant(tenantId);
  if (tenant?.isActive) {
    await clientStorage.updateUser(user.id, { tenantId });
    queryClient.invalidateQueries();
  }
};
```

## Build and Deployment

### Build Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   TypeScript │────▶│    Vite      │────▶│   Static     │
│   + React    │     │   (esbuild)  │     │   Bundle     │
└──────────────┘     └──────────────┘     │   (./dist)   │
                                          └──────────────┘
```

### Code Splitting

The build uses manual chunks for optimal loading:

| Chunk | Contents |
|-------|----------|
| `vendor-react` | React, React DOM |
| `vendor-ui` | Radix UI components |
| `vendor-charts` | Recharts |
| `vendor-utils` | date-fns, clsx, wouter |
| `index` | Main application code |
| Page chunks | Lazy-loaded page components |

### Testing

The project uses Vitest for unit and component testing:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

Test configuration is in `vitest.config.ts` with jsdom environment for React component testing.

### Deployment (Firebase Hosting)

```yaml
# .github/workflows/firebase-deploy.yml
- npm ci
- npm run build:firebase
- Deploy ./dist to Firebase Hosting
```

## Key Design Decisions

### Why Firebase?

1. **Managed Backend**: No server infrastructure to maintain
2. **Scalability**: Automatic scaling with usage
3. **Security**: Built-in authentication and security rules
4. **Cost-Effective**: Generous free tier, pay-as-you-grow
5. **Reliability**: Google Cloud infrastructure

### Why IndexedDB Cache?

1. **Offline Support**: Works without internet connection
2. **Performance**: Instant local data access
3. **Persistence**: Survives browser restarts
4. **Reduced Costs**: Fewer Firestore read operations

### Why TanStack Query?

1. **Caching**: Efficient data caching layer
2. **Consistency**: Unified data fetching patterns
3. **Optimistic Updates**: Better UX for mutations
4. **Sync Management**: Handles online/offline transitions

### Trade-offs

| Benefit | Trade-off |
|---------|-----------|
| Cloud sync | Requires Firebase account |
| Managed backend | Firebase vendor lock-in |
| Offline capable | Data must sync eventually |
| Free tier generous | Costs increase with scale |

## Extending the Architecture

### Adding New Features

1. **New Data Model**: Add to `shared/schema.ts` and `indexeddb.ts`
2. **New Page**: Create in `pages/`, add route to `App.tsx`
3. **New Component**: Create in `components/`
4. **New Hook**: Create in `hooks/`

### Adding New Firestore Collection

```typescript
// In firestore-service.ts
async addNewCollection(userId: string, data: any) {
  return await this.addUserData(userId, 'newCollection', data);
}

async getNewCollection(userId: string) {
  return await this.getUserData(userId, 'newCollection');
}

// Update firestore.rules to add security rules
match /users/{userId}/newCollection/{docId} {
  allow read, write: if request.auth.uid == userId;
}

// Add indexes to firestore.indexes.json if needed
```

## Related Documentation

- [README.md](README.md) - Getting started and features
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [TENANT_SWITCHING.md](TENANT_SWITCHING.md) - Multi-tenant feature details
