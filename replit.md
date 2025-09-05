# Overview

Vault is a modern, production-ready file storage platform built as a full-stack web application. It provides secure file upload, organization, sharing, and preview capabilities with a mobile-first responsive design. The application supports drag-and-drop uploads, folder management, file previews for multiple formats (PDF, images, audio, video), and secure sharing with expiration and password protection. It features three theme options (light, dim, and pure black) and includes PWA capabilities for offline functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18 with TypeScript, Vite for build tooling, and Tailwind CSS for styling with shadcn/ui component library.

**Routing**: Uses Wouter for lightweight client-side routing with protected routes that check authentication status.

**State Management**: React Query (TanStack Query) handles server state management, caching, and synchronization. Local state is managed with React hooks and context providers.

**UI Components**: Built on Radix UI primitives through shadcn/ui for accessibility compliance (WCAG 2.1 AA). Components are designed mobile-first with responsive layouts.

**Theme System**: Custom theme provider supports three themes (light, dim, black) with CSS custom properties and localStorage persistence. Integrates with Tailwind's dark mode classes.

**File Upload**: Implements drag-and-drop with progress tracking, supports multipart uploads for large files via S3 presigned URLs, and includes client-side validation.

## Backend Architecture

**Runtime**: Node.js 20+ with Express.js framework providing RESTful API endpoints.

**Authentication**: Session-based auth using Passport.js with local strategy (email/password), bcrypt for password hashing, and secure httpOnly cookies for session management.

**Database Layer**: Drizzle ORM with PostgreSQL in production, configured for Neon serverless database with connection pooling.

**File Processing**: Multer for multipart form handling, archiver for ZIP creation, and MIME type validation with size limits.

**Security**: Rate limiting with express-rate-limit, CORS configuration, and input validation using Zod schemas.

## Data Storage Solutions

**Database**: PostgreSQL with Drizzle ORM providing type-safe database operations. Schema includes users, folders, files, share links, and audit logs with proper indexing and foreign key relationships.

**File Storage**: S3-compatible object storage (AWS S3, Cloudflare R2, MinIO) with presigned URLs for direct uploads/downloads. Local filesystem fallback for development environments.

**Session Storage**: PostgreSQL-backed session store using connect-pg-simple for persistent user sessions.

## Authentication and Authorization

**Strategy**: Email/password authentication with bcrypt hashing (cost factor configurable). JWT sessions stored in httpOnly cookies for security.

**Session Management**: PostgreSQL session store with automatic cleanup and configurable expiration.

**Rate Limiting**: Dedicated limiters for authentication endpoints (5 attempts per 15 minutes) and upload endpoints (10 per minute).

**Authorization**: Role-based access control with admin/user roles, resource ownership validation for files and folders.

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling via @neondatabase/serverless
- **S3-Compatible Storage**: AWS SDK v3 for S3 operations with presigned URL support

## Development Tools
- **Vite**: Frontend build tool with React plugin and development server
- **TypeScript**: Type checking across client, server, and shared code
- **Drizzle Kit**: Database migrations and schema management

## UI/UX Libraries
- **Radix UI**: Headless accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library with consistent design

## Backend Services
- **Express.js**: Web framework with middleware ecosystem
- **Passport.js**: Authentication middleware with session management
- **Multer**: File upload handling with memory storage
- **Archiver**: ZIP file creation for batch downloads

## Client Libraries
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight client-side routing
- **React Dropzone**: Drag-and-drop file upload interface