# Better Auth MongoDB Demo

A modern authentication template built with Next.js, Better Auth, and MongoDB. Features user registration, authentication, and a full-featured todo application demonstrating CRUD operations with MongoDB.

## Features

- 🔐 **Authentication**: Complete auth system with Better Auth
  - Email/password registration and login
  - GitHub OAuth support (configurable)
  - Session management with middleware protection
- 🍃 **MongoDB Integration**: Full MongoDB adapter for Better Auth
  - User and session storage
  - Todo CRUD operations
- 🎨 **Modern UI**: Built with shadcn/ui components
  - Responsive design
  - Dark/light theme support
  - Beautiful, accessible components
- ✅ **Todo Management**: Complete todo application
  - Create, read, update, delete todos
  - Toggle completion status
  - User-specific todos with authentication

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Better Auth with MongoDB adapter
- **Database**: MongoDB
- **Styling**: TailwindCSS + shadcn/ui
- **TypeScript**: Full type safety
- **UI Components**: Radix UI + Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or Atlas)

### Environment Variables

Create a `.env.local` file in the root directory (see `.env.example` for reference):

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=better-auth

# Better Auth Configuration
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secure-secret-key-here-minimum-32-characters

# GitHub OAuth (required for social login)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Installation & Development

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/auth/          # Better Auth API routes
│   ├── auth/              # Authentication pages (login/signup)
│   ├── todos/             # Todo management page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/              # Authentication components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and configuration
│   ├── auth.ts           # Better Auth configuration
│   ├── auth-client.ts    # Client-side auth hooks
│   ├── auth-server.ts    # Server-side auth utilities
│   ├── actions.ts        # Server actions with auth checks
│   ├── mongodb.ts        # MongoDB client setup
│   ├── env.ts            # Environment variable validation
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Utility functions (cn, etc.)
└── middleware.ts          # Route protection middleware
components.json            # shadcn/ui configuration
.env.example              # Environment variables template
```

## Authentication Flow

1. **Landing Page**: Welcome screen that redirects authenticated users to todos
2. **Registration/Login**: Forms with validation and error handling
3. **Todo Dashboard**: Protected route at `/todos` with user profile and todo management
4. **Session Management**: Automatic session handling with Better Auth and middleware protection

## API Routes

- `POST /api/auth/*` - Better Auth endpoints (handled automatically)

Todo operations are handled via server actions in `src/lib/actions.ts` instead of API routes:
- `getTodos()` - Fetch user's todos
- `createTodo()` - Create new todo  
- `updateTodo()` - Update todo
- `deleteTodo()` - Delete todo

## MongoDB Schema

The app uses Better Auth's automatic schema creation for users and sessions, plus custom collections for todos with proper user relationships.

## Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Better Auth Documentation](https://better-auth.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/?utm_campaign=devrel&utm_source=third-party-content&utm_medium=cta&utm_content=github-better-auth-mongodb&utm_term=jesse.hall)
- [shadcn/ui Documentation](https://ui.shadcn.com)
