# ChatFlow - Real-time Chat Application

## Overview

ChatFlow is a modern real-time chat application built with React, Express, and PostgreSQL. The application features a Discord-like interface with chat rooms, user authentication via Replit Auth, and real-time messaging capabilities. Users can create and join chat rooms, send messages, and see other online users in a clean, responsive interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom chat theme colors and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Middleware**: Custom logging, JSON parsing, and error handling
- **Development**: Hot reload with tsx and Vite integration

### Database Layer
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Shared TypeScript schema definitions between client and server
- **Migrations**: Drizzle Kit for database migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling
- **User Storage**: Mandatory user and session tables for Replit Auth compliance

### Real-time Features
- **Messaging**: HTTP-based messaging with React Query for real-time updates
- **User Presence**: Room member tracking and online status
- **Auto-refresh**: Query invalidation for live updates

### Data Models
- **Users**: Profile information with optional first/last name and profile images
- **Rooms**: Chat rooms with descriptions and creator tracking
- **Messages**: Timestamped messages with user associations
- **Room Members**: Many-to-many relationship for room participation

### Error Handling
- **Client**: Centralized error handling with toast notifications
- **Server**: Structured error responses with proper HTTP status codes
- **Auth**: Automatic redirect to login on 401 unauthorized errors

### UI/UX Design
- **Theme**: Dark chat interface with custom color palette
- **Responsive**: Mobile-first design with collapsible sidebar
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Components**: Modular component structure with consistent styling

## External Dependencies

### Core Runtime
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe database ORM and query builder
- **express**: Web framework for Node.js backend
- **react**: Frontend UI framework with TypeScript

### Authentication
- **openid-client**: OpenID Connect client for Replit Auth
- **passport**: Authentication middleware for Express
- **express-session**: Session management with PostgreSQL storage
- **connect-pg-simple**: PostgreSQL session store adapter

### UI Framework
- **@radix-ui/***: Headless UI primitives for accessible components
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration and introspection tools
- **wouter**: Lightweight routing for React applications
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Validation & Utilities
- **zod**: TypeScript-first schema validation
- **react-hook-form**: Performant form handling with validation
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Conditional CSS class utility for dynamic styling