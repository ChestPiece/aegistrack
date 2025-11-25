# AegisTrack

A comprehensive project management system built with React, TypeScript, and MongoDB.

## Project Overview

AegisTrack is a modern project management platform that enables teams to collaborate effectively on projects and tasks. It features role-based access control, real-time notifications, and a clean, intuitive interface.

## Features

- **User Management**: Role-based access (Admin/Member) with full profile management
- **Project Management**: Create, update, and track projects with status workflows
- **Task Management**: Assign and manage tasks with deadlines and status tracking
- **Dashboard Analytics**: Visual insights into project and task progress
- **Notifications**: Real-time notification system for important updates
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

### Frontend

- **React** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Supabase** for authentication

### Backend

- **Node.js** with Express
- **TypeScript**
- **MongoDB** with Mongoose ODM
- **JWT** authentication

## Getting Started

### Prerequisites

- Node.js 16+ installed
- MongoDB instance running
- Supabase account for authentication

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd aegistrack
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd backend
npm install
```

4. Configure environment variables:

Create `.env` in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
aegistrack/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── types/             # TypeScript type definitions
├── backend/               # Backend source code
│   └── src/
│       ├── controllers/   # Request handlers
│       ├── models/        # MongoDB models
│       ├── routes/        # API routes
│       └── middleware/    # Custom middleware
└── public/                # Static assets
```

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
