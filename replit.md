# FanConnect - Social Platform for Content Creators

## Overview

FanConnect is a full-stack social media platform designed for content creators (models) and their fans to connect, share content, and engage through messaging and posts. The platform features a comprehensive user role system with different dashboards for fans, models, workers, and administrators. Built with React, Node.js/Express, and PostgreSQL, it includes real-time messaging capabilities and a virtual currency (gems) system for premium interactions.

## Recent Changes

### December 2024
- **Database Seeding API**: Added `/api/admin/seed-database` endpoint that creates sample data (1 admin, 3 workers, 5 models with posts, 3 fans) when database is empty
- **Story Feature Removal**: Removed the visual story circles feature from fan dashboard to focus on core post functionality
- **TypeScript Improvements**: Fixed null-safety issues across components for better type safety
- **Sample Credentials**: Seeding API provides test credentials for each user role for easy development testing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query for server state and React Context for client state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme service supporting multiple color schemes and dark/light modes

### Backend Architecture
- **Framework**: Express.js with TypeScript in ESM format
- **API Design**: RESTful endpoints with role-based route protection
- **Real-time Communication**: WebSocket server using the 'ws' library for live messaging
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Handling**: Multer for file uploads with configurable storage limits
- **Error Handling**: Centralized error middleware with structured error responses

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Database**: PostgreSQL with Neon Database serverless hosting
- **Schema Design**: Comprehensive relational schema supporting:
  - User management with role-based access (fan, model, worker, admin)
  - Content posts with media attachments and premium content support
  - Social features (follows, likes, saves)
  - Real-time messaging system
  - Virtual currency (gems) transactions
  - Worker-to-model assignments for content management

### Authentication & Authorization
- **Strategy**: JWT token-based authentication stored in localStorage
- **Role System**: Four distinct user roles with different permission levels
- **Route Protection**: Middleware-based authentication for API endpoints
- **WebSocket Auth**: Token-based WebSocket connection authentication

### Real-time Features
- **WebSocket Implementation**: Custom WebSocket service with automatic reconnection
- **Message System**: Real-time chat between users with read status tracking
- **Connection Management**: Client connection mapping for targeted message delivery
- **Event System**: Custom event handling for real-time updates

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React
- **@radix-ui/***: Headless UI components for accessibility
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **express**: Node.js web framework
- **ws**: WebSocket library for real-time communication

### Database & Storage
- **@neondatabase/serverless**: Serverless PostgreSQL database hosting
- **connect-pg-simple**: PostgreSQL session store for Express
- **drizzle-kit**: Database migration and schema management tools

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification
- **multer**: File upload middleware for Express

### UI & Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Conditional className utility
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for Node.js development
- **@replit/vite-plugin-***: Replit-specific development plugins

### Additional Features
- **date-fns**: Date manipulation and formatting
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation library
- **react-dropzone**: File upload component with drag-and-drop