# Changelog

All notable changes to the Gym Pad project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **RPE (Rate of Perceived Exertion) System** - Complete 1-10 scale effort tracking with color-coded display
- **Auto-Regulation Intelligence** - Smart weight/rep recommendations based on RPE history and target rep ranges
- **Template-Specific Exercise Prefill** - Prevents cross-workout contamination (e.g., heavy squats on Legs day vs light squats on Lower day)
- **Progressive Overload Algorithm** - Intelligent progression recommendations using RPE data
- **RPE Analytics** - Fatigue monitoring, readiness assessment, and training stress analysis
- **Enhanced Workout Forms** - RPE sliders appear progressively after weight/reps are entered
- **Comprehensive workout display** - RPE shown in exercise summaries, session details, and history
- Comprehensive documentation suite in `docs/` directory
- **API Documentation** (`docs/API.md`) - Complete API reference with all endpoints, request/response formats, and examples
- **Architecture Documentation** (`docs/ARCHITECTURE.md`) - System architecture, component structure, data flow diagrams, and technology stack overview
- **Database Schema Documentation** (`docs/DATABASE.md`) - Entity relationship diagrams, table descriptions, constraints, and performance considerations
- **Deployment Guide** (`docs/DEPLOYMENT.md`) - Step-by-step deployment instructions for Vercel, Railway, Docker, and custom hosting
- **Contributing Guide** (`docs/CONTRIBUTING.md`) - Development setup, coding standards, testing guidelines, and contribution workflow
- Updated README.md with documentation links and improved project structure overview
- Project changelog to track all changes going forward

### Changed

- **Enhanced Exercise Validation** - Added RPE validation (1-10 integer scale) to exercise data validation
- **Improved Data Persistence** - RPE data now properly saved and retrieved through all workout forms
- **Template Progression Logic** - Exercise prefill now uses template-specific history instead of global exercise history
- Reorganized README.md to focus on quick start with links to detailed documentation
- Updated API section to reference comprehensive API documentation
- Enhanced deployment section with reference to detailed deployment guide

### Documentation

- Created visual database schema diagrams using Mermaid
- Added system architecture diagrams showing component relationships
- Documented all 16 API endpoints with request/response examples
- Included security considerations, performance optimization, and monitoring guidelines
- Added troubleshooting guides for common deployment issues

## [Previous Releases]

### Authentication & Weight Tracking System

- Added user authentication with session-based security
- Implemented weight tracking with goals and progress monitoring
- Added session templates for workout planning
- Enhanced database schema with proper relationships and constraints

### Core Workout Tracking Features

- Workout session creation and management
- Exercise tracking with sets, reps, and weights
- Progress visualization with interactive charts
- Exercise history and analytics
- Real-time data synchronization with SWR

### Migration to Next.js Fullstack

- Migrated from React + Vite to Next.js 15 with App Router
- Implemented Next.js API routes for backend functionality
- Added PostgreSQL database with Prisma ORM
- Configured for Vercel deployment with automatic builds

---

**Note**: This changelog was started with the documentation overhaul. Previous changes were reconstructed from git history and project evolution.
