# replit.md

## Overview

This is a full-stack web application for cybersecurity certification training called "SecuraCert". It's built with a React frontend and Express.js backend, featuring a quiz-based learning platform where users can take practice exams for various cybersecurity certifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application
- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and schemas
- `components.json` - shadcn/ui configuration
- `drizzle.config.ts` - Database configuration

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query with custom API client
- **Routing**: File-based routing with Wouter

### Backend Architecture
- **API Structure**: RESTful endpoints under `/api` prefix
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Authentication**: bcrypt for password hashing (session-based auth)
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Development**: Vite integration for hot module replacement

### Database Schema
Core entities include:
- **Users**: Authentication and user management
- **Categories**: Main certification categories (CISSP, CEH, etc.)
- **Subcategories**: Specific topic areas within certifications
- **Questions**: Quiz questions with multiple choice options
- **Quizzes**: User quiz sessions with scoring and progress tracking
- **User Progress**: Category-based learning progress tracking

## Data Flow

### User Authentication Flow
1. User registration/login through `/api/register` and `/api/login`
2. Credentials stored in localStorage for client-side session management
3. Password hashing with bcrypt on the server side

### Quiz Taking Flow
1. User selects categories and creates quiz via `/api/quiz`
2. Questions fetched based on selected categories/subcategories
3. Real-time quiz interface with timer and progress tracking
4. Answer submission and scoring via `/api/quiz/:id/submit`
5. Results display with detailed performance analytics

### Progress Tracking
- Category-based progress tracking
- Quiz history and statistics
- Performance analytics and scoring

## External Dependencies

### Frontend Dependencies
- **UI Components**: @radix-ui/* for accessible component primitives
- **State Management**: @tanstack/react-query for server state
- **Forms**: react-hook-form with @hookform/resolvers for validation
- **Styling**: tailwindcss, class-variance-authority, clsx for styling utilities
- **Routing**: wouter for lightweight client-side routing

### Backend Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm, drizzle-zod
- **Authentication**: bcrypt for password hashing
- **Session Management**: connect-pg-simple for PostgreSQL session store
- **Utilities**: date-fns for date manipulation

### Development Dependencies
- **Build Tools**: vite, esbuild for production builds
- **TypeScript**: Full TypeScript support across the stack
- **Development**: tsx for TypeScript execution, @replit/* plugins for Replit integration

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations in `migrations/` folder

### Environment Setup
- **Database**: Requires `DATABASE_URL` environment variable
- **Development**: Uses Vite dev server with Express API proxy
- **Production**: Serves static files from Express with API routes

### Scripts
- `npm run dev` - Development with hot reload
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Push database schema changes

The application follows a modern full-stack TypeScript architecture with strong type safety, component-driven UI development, and a scalable backend API structure suitable for a quiz-based learning platform.