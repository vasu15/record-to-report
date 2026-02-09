# Accruals Pro - Financial Accruals Management System

## Overview
Production-ready financial accruals management system with role-based access control, JWT authentication, and comprehensive modules for managing period-based accruals, activity-based accruals, non-PO accruals, approval rules, user management, reports, and system configuration.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, shadcn/ui components, Recharts for data visualization
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (17 tables)
- **Auth**: JWT tokens (sessionStorage) + bcrypt password hashing

## Key Files
- `shared/schema.ts` - Drizzle ORM schema (17 tables) with Zod validation
- `server/routes.ts` - All API routes with auth middleware
- `server/storage.ts` - Data access layer with all CRUD operations
- `server/auth.ts` - JWT generation/verification, bcrypt utilities, auth middleware
- `server/seed.ts` - Demo data seeding (4 users, 12 PO lines, config, permissions)
- `client/src/App.tsx` - Route configuration with role-based access
- `client/src/contexts/AuthContext.tsx` - Authentication state management
- `client/src/components/layout/AppLayout.tsx` - Main layout with sidebar navigation
- `client/src/lib/api.ts` - API utilities with auth headers

## Demo Users
- Finance Admin: admin@company.com / Admin@123
- Finance Approver: approver@company.com / Approver@123
- Business User: user@company.com / User@123
- Business User 2: sanjay@company.com / User@123

## Recent Changes
- 2026-02-09: Initial build - complete frontend and backend implementation
  - 17-table PostgreSQL schema with Drizzle ORM
  - JWT auth with bcrypt, role-based middleware
  - Full frontend with 10 pages, sidebar navigation, dark mode
  - CSV upload/parsing with PapaParse
  - Period-based accrual calculations with true-up support
  - Activity-based PO assignment and response workflow
  - Non-PO form builder and submission system
  - Reports with Recharts visualizations
  - System configuration management
