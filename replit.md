# Seat Plan Maker - Exam Seating Arrangement System

## Overview

This is a full-stack web application for managing exam seating arrangements in vocational diploma institutions. The system allows administrators to create, manage, and distribute seating plans efficiently with automated seat allocation and invigilator assignment features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for global state management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Design**: RESTful API with structured error handling
- **Development**: Hot module replacement with Vite integration

### Database Schema
The application uses a relational database with the following key entities:
- **Departments**: Academic departments (CST, CT, PT, ET, ENT, EMT)
- **Buildings**: Physical building structures
- **Rooms**: Exam rooms with capacity and layout configuration
- **Invigilators**: Teaching staff assigned to supervise exams
- **Exams**: Exam details including date, shift, course, and department
- **Students**: Student information with department associations
- **Seat Assignments**: Individual seat allocations linking students to specific room positions
- **Invigilator Assignments**: Staff assignments to exam rooms with role definitions

## Key Components

### Configuration Panel
Handles exam setup including:
- Exam details (name, date, shift, department, course)
- Room selection with building-based filtering
- Student and invigilator file uploads
- Seating pattern configuration (linear, serpentine, block, randomized)

### Preview Panel
Provides real-time visualization of:
- Generated seating arrangements with department-coded color schemes
- Statistics dashboard (total students, rooms, invigilators, capacity)
- Room-by-room seating grids
- PDF generation options for different stakeholders

### Seating Grid Component
Visual representation of room layouts with:
- Configurable rows and columns
- Department-based color coding for easy identification
- Student information display on seat hover/click
- Teacher's desk positioning

## Data Flow

1. **Exam Creation**: Admin inputs exam details and selects rooms
2. **File Upload**: Student and invigilator data imported via file upload
3. **Seat Generation**: Algorithm assigns seats based on selected pattern and room capacity
4. **Invigilator Assignment**: Staff automatically assigned to rooms based on availability and hierarchy
5. **Preview & Validation**: Real-time preview of seating arrangements
6. **PDF Generation**: Multiple output formats for distribution

## External Dependencies

### UI Components
- Radix UI primitives for accessible component foundation
- Lucide React for consistent iconography
- Class Variance Authority for component variant management

### Database & Deployment
- Neon Database for serverless PostgreSQL hosting
- Drizzle Kit for database migrations and schema management
- Connect-pg-simple for session storage

### Development Tools
- ESBuild for production bundling
- TSX for TypeScript execution in development
- Replit integration for cloud development environment

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- TSX for backend development with automatic restarts
- Shared TypeScript configuration across client and server

### Production
- Vite builds optimized client bundle
- ESBuild creates server bundle with external dependencies
- Single deployment artifact serving both static assets and API
- Environment-based configuration for database connections

### Database Management
- Drizzle migrations for schema versioning
- Shared schema definitions between client and server
- Type-safe database operations with generated types

The application follows a monorepo structure with shared TypeScript types and utilities, enabling type safety across the full stack while maintaining separation of concerns between client and server code.