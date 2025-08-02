# Cert Lab

## Overview
Cert Lab is an AI-powered certification learning platform featuring Helen, an intelligent learning assistant. It offers an advanced learning environment for mastering certifications through AI-guided experiences, adaptive assessments, personalized study paths, and intelligent feedback. The platform aims to be a comprehensive "Cert Lab" study environment, preparing users for certifications with practical, AI-supported learning.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **State Management**: TanStack Query.
- **Routing**: Wouter.

### Design Principles
- **UI/UX**: Modern, borderless design with enhanced shadows and clear visual hierarchy. Emphasizes spacious card layouts, improved typography, and consistent visual priority.
- **Mobile Responsiveness**: Comprehensive mobile optimization with touch-friendly components, responsive layouts, and a dedicated mobile navigation system.
- **Theming**: Implemented a comprehensive theme system with 7 distinct color schemes (Light, Dark, Ocean, Forest, Sunset, Purple, High Contrast) and WCAG contrast compliance.
- **User Engagement**: Incorporates gamification elements like a daily learning streak, achievement badges, XP, and level progression to motivate learners.
- **Learning Methodology**: Focuses on continuous learning with immediate feedback, AI-driven adaptive learning paths, personalized study plans, and comprehensive results analysis. Helen, the AI assistant, guides users with natural language insights.
- **Architectural Patterns**: Full-stack TypeScript for type safety, component-driven UI development, and a scalable RESTful API structure.

### Key Features and Components
- **AI-Powered Learning**: Helen provides adaptive assessments, personalized study paths, intelligent feedback, and AI-generated lecture notes based on quiz performance (integrated with OpenAI GPT-3.5-turbo).
- **Quiz System**: Features authentic certification questions, real-time feedback, and a comprehensive review system. Supports adaptive question adjustment based on user performance.
- **Dashboard**: Offers a personalized overview with study plan recommendations, weekly progress tracking, and quick actions for focused practice.
- **Navigation**: Enhanced navigation with a mega menu, breadcrumb navigation, and contextual quick actions.
- **Multi-Tenant Admin System**: Comprehensive platform for managing tenants (organizations), categories, questions, and users, supporting tenant isolation.
- **Gamification**: Includes a learning streak feature with visual progression, a robust achievement system with 90+ badges, and XP/level progression.
- **Accessibility**: Built-in accessibility color contrast analyzer for WCAG compliance.

### Database Schema
Core entities include: Users, Categories, Subcategories, Questions, Quizzes, User Progress, Achievements, and Tenant-specific data for multi-tenancy.

## External Dependencies

### Frontend
- `@radix-ui/*`: Accessible UI component primitives.
- `@tanstack/react-query`: Server state management.
- `react-hook-form`, `@hookform/resolvers`: Form management and validation.
- `tailwindcss`, `class-variance-authority`, `clsx`: Styling utilities.
- `wouter`: Lightweight client-side routing.

### Backend
- `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`: PostgreSQL database interaction.
- `bcrypt`: Password hashing.
- `connect-pg-simple`: PostgreSQL session store.
- `date-fns`: Date manipulation utilities.
- `openai`: Integration for AI-powered content generation.

### Development
- `vite`, `esbuild`: Build tools.
- `typescript`: Language support.
- `tsx`: TypeScript execution.
- `@replit/*`: Replit integration plugins.