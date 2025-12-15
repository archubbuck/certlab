# Project Structure

This document describes the organization of the CertLab repository, following common patterns found in well-structured React/TypeScript projects like React, Next.js, and Vite.

## 📂 Root Directory

```
certlab/
├── .github/              # GitHub configuration and workflows
├── client/               # Frontend application source code
├── docs/                 # All documentation
├── scripts/              # Build and utility scripts
├── shared/               # Shared types and utilities
├── tools/                # Development tools
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # Contribution guidelines
├── README.md             # Project overview
├── SECURITY.md           # Security policy
└── package.json          # Project dependencies and scripts
```

## 📁 Directory Details

### `.github/` - GitHub Configuration

```
.github/
├── workflows/            # GitHub Actions CI/CD workflows
│   ├── firebase-deploy.yml      # Production deployment
│   ├── dependabot-auto-merge.yml # Auto-merge dependencies
│   ├── dependency-audit.yml     # Security audits
│   ├── lint.yml                 # Code linting
│   └── create-issues.yml        # Issue automation
├── copilot-instructions.md  # AI coding assistant guidelines
├── copilot-setup-steps.yaml # Setup automation
└── dependabot.yml          # Dependency update configuration
```

**Purpose**: GitHub-specific configuration for CI/CD, automation, and developer tools.

### `client/` - Frontend Application

```
client/
├── public/               # Static assets (favicons, images)
│   └── favicons/        # Multiple favicon formats
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components (Radix UI wrappers)
│   │   └── quiz/       # Quiz-specific components
│   ├── pages/          # Page-level components (routes)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and services
│   │   ├── auth-provider.tsx    # Authentication context
│   │   ├── client-storage.ts    # IndexedDB storage layer
│   │   ├── storage-factory.ts   # Storage abstraction
│   │   ├── firebase.ts          # Firebase configuration
│   │   ├── dynatrace.ts         # Observability integration
│   │   └── utils.ts             # Helper functions
│   ├── data/           # Static data files
│   ├── test/           # Test utilities and setup
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
└── index.html          # HTML template
```

**Purpose**: All client-side application code following React best practices.

**Key Conventions**:
- **Components**: PascalCase, organized by feature or type
- **Hooks**: camelCase with `use` prefix
- **Pages**: kebab-case filenames, lazy-loaded in App.tsx
- **UI Components**: Shadcn/Radix UI pattern with local modifications

### `docs/` - Documentation

```
docs/
├── setup/                    # Configuration guides
│   ├── firebase.md          # Firebase setup
│   ├── google-auth.md       # Google OAuth setup
│   ├── dynatrace.md         # Monitoring setup
│   ├── dependabot.md        # Dependency automation
│   └── deployment.md        # Deployment guide
├── architecture/             # Technical documentation
│   ├── overview.md          # System architecture
│   ├── state-management.md  # State patterns
│   └── firebase-status.md   # Implementation status
├── features/                 # Feature documentation
│   └── tenant-switching.md  # Multi-tenancy
├── user-manual.md           # End-user guide
├── dynatrace-examples.md    # Monitoring examples
├── dynatrace-integration.md # Monitoring integration
├── test-report.md           # Test coverage
├── favicon-options.md       # Design options
├── known-issues.md          # Known issues
└── README.md                # Documentation index
```

**Purpose**: Organized documentation following standard practices (setup, architecture, features).

**Organization Pattern**: Inspired by documentation structures in projects like React, Vue, and Next.js, where guides are categorized by purpose.

### `scripts/` - Build & Utility Scripts

```
scripts/
├── check-firebase-config.js       # Validate Firebase configuration
└── generate-dynatrace-snippet.js  # Generate monitoring snippet
```

**Purpose**: Build-time scripts and utilities referenced in `package.json`.

**Convention**: All scripts are executable and use Node.js ESM modules.

### `shared/` - Shared Code

```
shared/
├── schema.ts            # TypeScript types and Drizzle schemas
├── env.ts              # Environment variable management
└── storage-interface.ts # Storage abstraction interfaces
```

**Purpose**: Code shared between client (and potentially server in future), similar to monorepo `packages/shared` patterns.

### `tools/` - Development Tools

```
tools/
└── ui-structure-analyzer/   # Development tool for analyzing UI structure
    ├── analyzer.ts          # Analysis logic
    ├── index.ts            # Main entry point
    ├── run.ts              # Runner script
    ├── types.ts            # Type definitions
    ├── plugins/            # Build plugins
    └── package.json        # Tool dependencies
```

**Purpose**: Developer tooling that's not part of the main application bundle.

## 🗂️ Configuration Files

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies, scripts, and project metadata |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Vite build tool configuration |
| `vitest.config.ts` | Vitest test framework configuration |
| `tailwind.config.ts` | TailwindCSS styling configuration |
| `postcss.config.js` | PostCSS configuration for CSS processing |
| `eslint.config.mjs` | ESLint linting rules |
| `components.json` | Shadcn UI component configuration |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore patterns |
| `.prettierrc` | Prettier code formatting rules |
| `.prettierignore` | Prettier ignore patterns |
| `firebase.json` | Firebase Hosting configuration |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore database indexes |

## 📦 Build Outputs

| Directory | Description | Git Tracked |
|-----------|-------------|-------------|
| `dist/` | Production build output | ❌ No |
| `node_modules/` | NPM dependencies | ❌ No |
| `coverage/` | Test coverage reports | ❌ No |
| `.firebase/` | Firebase deployment cache | ❌ No |

## 🔍 Finding Files

### Common File Patterns

**Components**:
```
client/src/components/ComponentName.tsx
client/src/components/ui/component-name.tsx
client/src/components/quiz/QuestionDisplay.tsx
```

**Pages**:
```
client/src/pages/page-name.tsx
```

**Hooks**:
```
client/src/hooks/useHookName.ts
client/src/hooks/use-hook-name.tsx (if includes JSX)
```

**Tests**:
```
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx
```

**Types**:
```
shared/schema.ts
client/src/lib/api-types.ts
```

## 🎯 Navigation Guide

### For New Contributors

1. **Start Here**: [README.md](../README.md) - Project overview
2. **Set Up Dev Environment**: [docs/setup/deployment.md](setup/deployment.md)
3. **Understand Architecture**: [docs/architecture/overview.md](architecture/overview.md)
4. **Read Guidelines**: [CONTRIBUTING.md](../CONTRIBUTING.md)

### For Users

1. **Getting Started**: [README.md](../README.md)
2. **User Guide**: [docs/user-manual.md](user-manual.md)
3. **Known Issues**: [docs/known-issues.md](known-issues.md)

### For DevOps/Deployment

1. **Firebase Setup**: [docs/setup/firebase.md](setup/firebase.md)
2. **Deployment Guide**: [docs/setup/deployment.md](setup/deployment.md)
3. **Monitoring**: [docs/setup/dynatrace.md](setup/dynatrace.md)

## 🔨 Development Workflow

### Adding New Features

1. Create components in `client/src/components/`
2. Add pages in `client/src/pages/`
3. Update types in `shared/schema.ts`
4. Add tests alongside source files
5. Update documentation in `docs/`

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `QuizInterface.tsx` |
| Pages | kebab-case | `practice-tests.tsx` |
| Utilities | camelCase | `utils.ts` |
| Hooks | camelCase with `use` | `useAuth.ts` |
| Types | PascalCase | `User`, `Quiz` |
| Constants | UPPER_SNAKE_CASE | `MAX_QUESTIONS` |

## 📚 Similar Projects

This structure is inspired by well-organized open-source projects:

- **React** - Clear separation of concerns, organized docs
- **Next.js** - Documentation organization (setup, architecture, features)
- **Vite** - Simple root structure, focused tooling
- **shadcn/ui** - Component organization patterns
- **TanStack Query** - Clear examples and guides

## 🔄 Recent Changes

As of v2.0.0:

1. ✅ **Moved all documentation to `docs/`** with categorized subdirectories
2. ✅ **Removed unused scripts** (7 files) from `scripts/`
3. ✅ **Removed duplicate files** (auth.tsx, use-mobile.ts)
4. ✅ **Updated all cross-references** to new paths
5. ✅ **Added comprehensive docs/README.md** for navigation

See [CHANGELOG.md](../CHANGELOG.md) for detailed version history.

---

**Questions?** See [docs/README.md](README.md) or open an issue.
