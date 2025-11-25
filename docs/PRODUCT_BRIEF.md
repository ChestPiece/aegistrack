# AegisTrack Product Brief

## Project Overview

**AegisTrack** is a collaborative project management platform designed to streamline task and project tracking within teams. The application provides role-based dashboards for both administrators and regular users, enabling efficient project oversight, task management, and team collaboration. Built with modern web technologies, AegisTrack offers a responsive, glassmorphic UI with dark/light theme support and real-time data synchronization.

## Target Audience

### Primary Users

- **Small to Medium-sized Development Teams** - Teams that need lightweight project management without enterprise overhead
- **Agencies and Consultancies** - Organizations managing multiple client projects simultaneously
- **Startups** - Fast-moving teams requiring flexible task management and clear project visibility

### User Roles

- **Administrators** - Team leaders with full access to manage projects, tasks, and team members
- **Regular Users** - Team members who work on assigned tasks and contribute to projects
- **Project Stakeholders** - Team members who need visibility into project progress and completion rates

## Primary Benefits / Features

### Core Features

1. **Role-Based Dashboards**

   - Admin dashboard with system-wide statistics and oversight
   - User dashboard showing personalized task and project views
   - Real-time analytics and completion tracking

2. **Project Management**

   - Create and manage multiple projects
   - Track project status, deadlines, and member assignments
   - Monitor task completion progress per project
   - Grid-based project visualization

3. **Task Management**

   - Create, assign, and track tasks
   - Status-based workflow (pending → in progress → completed)
   - Deadline tracking with overdue detection
   - Task filtering by user assignment

4. **Team Collaboration**

   - User profile management
   - Team member directory
   - Project member assignments
   - Notification system (planned/in development)

5. **User Experience**
   - Modern glassmorphic UI design
   - Dark/light theme toggle with system preference detection
   - Skeleton loading states for improved perceived performance
   - Responsive design for mobile, tablet, and desktop

### Technical Features

- Secure authentication with email verification
- Password reset and account recovery flows
- Protected routes with role-based access control
- Persistent theme preferences via localStorage
- RESTful API architecture with JWT authentication

## High-Level Tech/Architecture

### Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: React Context API (Auth & Theme)
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation

### Backend Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Supabase Auth (JWT-based)
- **API Architecture**: RESTful endpoints with JWT middleware
- **Security**: Helmet.js, CORS configuration
- **Logging**: Morgan

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  - TypeScript, Tailwind CSS, shadcn/ui  │
└───────────────┬─────────────────────────┘
                │
                │ HTTP/REST API
                │ (JWT Bearer Token)
                │
┌───────────────▼─────────────────────────┐
│      Express.js Backend Server          │
│  - JWT Authentication Middleware        │
│  - RESTful API Endpoints                │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼──────┐ ┌─────▼─────────┐
│   MongoDB    │ │  Supabase     │
│  (Business   │ │  (Auth Only)  │
│   Logic)     │ │               │
└──────────────┘ └───────────────┘
```

### Key Design Decisions

- **Hybrid Backend**: Supabase handles authentication exclusively, while MongoDB stores all business data (projects, tasks, users)
- **API Client Pattern**: Centralized `api.ts` service handles all backend communication and token attachment
- **Theme System**: CSS variables with OKLCH color space for precise color control
- **Progressive Loading**: Skeleton components provide visual feedback during async operations
- **Type Safety**: Full TypeScript coverage across frontend and backend

### Development Environment

- Frontend runs on Vite dev server (default: http://localhost:5173)
- Backend runs on Express server (default: http://localhost:5000)
- Concurrent development requires both servers running simultaneously
- Hot module replacement (HMR) for rapid frontend iteration
