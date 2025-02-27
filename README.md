# Croner - Advanced Cron Task Management System

A modern web application for managing, scheduling, and monitoring cron tasks on Ubuntu 22.04 servers.

## Features

- 🔐 **Advanced Authentication**
  - Role-based access control
  - First-time admin account setup
  - Secure session management

- 📅 **Task Management**
  - Create and manage cron tasks
  - Flexible scheduling options
  - Support for curl commands and system executables
  - Task enable/disable functionality

- ⚡ **Execution Engine**
  - Automated scheduling
  - Manual task execution
  - Timeout management
  - Permission verification

- 📊 **Monitoring & History**
  - Detailed execution logs
  - Success/failure tracking
  - Performance metrics
  - Advanced filtering and search

- 🔔 **Smart Notifications**
  - Execution failure alerts
  - Daily/weekly execution summaries
  - Task modification notifications

## Tech Stack

- **Frontend**: Next.js 14, Shadcn UI, Tailwind CSS, Zustand
- **Backend**: Node.js 20 LTS, Next.js API Routes, NextAuth.js v5
- **Database**: SQLite with Prisma ORM
- **Deployment**: Ubuntu Server 22.04 LTS, PM2

## Prerequisites

- Node.js 20 LTS
- Ubuntu Server 22.04 LTS
- Git

## Quick Start

```bash
# Clone the repository
git clone https://github.com/barryab12/croner.git

# Install dependencies
cd croner
npm install

# Set up environment variables
cp .env.example .env

# Initialize the database
npm run db:setup

# Start development server
npm run dev
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
croner/
├── app/            # Next.js application routes
├── components/     # Reusable UI components
├── core/          # Core business logic modules
├── lib/           # Shared utilities and helpers
├── prisma/        # Database schema and migrations
└── public/        # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For support, please open an issue in the GitHub repository or contact the maintenance team.
