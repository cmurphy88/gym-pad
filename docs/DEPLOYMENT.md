# Deployment Guide

This document provides comprehensive deployment instructions for the Gym Pad application.

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides the best integration with Next.js and offers seamless deployment.

#### Prerequisites
- Vercel account
- GitHub repository
- PostgreSQL database (Vercel Postgres recommended)

#### Steps
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and connect project
   vercel login
   vercel
   ```

2. **Environment Variables**
   Set in Vercel dashboard or via CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   ```

3. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

#### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Branch deployments for development

### 2. Railway

Railway offers PostgreSQL and automatic deployments.

#### Steps
1. **Connect Repository**
   - Connect GitHub repository in Railway dashboard
   - Select the repository and branch

2. **Database Setup**
   ```bash
   # Add PostgreSQL service
   # Railway will provide DATABASE_URL automatically
   ```

3. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://... (automatically provided)
   NEXTAUTH_SECRET=your-secret-key
   ```

### 3. Docker Deployment

For custom hosting or container orchestration.

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/gympad
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=gympad
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Node Environment
NODE_ENV="production"
```

### Database URLs

#### PostgreSQL Database
```env
# Vercel Postgres
DATABASE_URL="postgres://user:password@host:port/database?sslmode=require"

# Railway
DATABASE_URL="postgresql://user:password@host:port/database"

# Self-hosted
DATABASE_URL="postgresql://user:password@localhost:5432/gympad"
```

## Database Setup

### 1. Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Or use migrate for production
npx prisma migrate deploy
```

### 2. Seed Database (Optional)
```bash
# Seed exercise templates
node lib/seed-templates.js

# Seed sample data
node lib/seed.js
```

## Pre-deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Linting passes
- [ ] TypeScript compilation successful
- [ ] Build completes without errors

### Security
- [ ] Environment variables set
- [ ] Secrets not committed to repository
- [ ] HTTPS enabled
- [ ] Database credentials secure

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Database indexes in place
- [ ] Caching configured

### Database
- [ ] Migrations applied
- [ ] Backup strategy in place
- [ ] Connection pooling configured
- [ ] Performance monitoring enabled

## Post-deployment Tasks

### 1. Verify Deployment
```bash
# Check application health
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","name":"Test User"}'
```

### 2. Monitor Application
- Check error logs
- Monitor response times
- Verify database connections
- Test critical user flows

### 3. Set Up Monitoring
- Application performance monitoring
- Error tracking
- Database monitoring
- Uptime monitoring

## Continuous Deployment

### GitHub Actions (Vercel)
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variable Issues
```bash
# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

### Performance Issues
- Enable Next.js analytics
- Monitor database query performance
- Check bundle size with `npm run analyze`
- Review Vercel function logs

### Database Issues
- Check connection pool settings
- Monitor query performance
- Verify migration status
- Review index usage

## Monitoring and Maintenance

### Application Monitoring
- **Uptime**: Monitor application availability
- **Performance**: Track response times and error rates
- **Usage**: Monitor user activity and feature usage
- **Security**: Track authentication attempts and errors

### Database Monitoring
- **Connection Pool**: Monitor pool usage and timeouts
- **Query Performance**: Track slow queries and optimization opportunities  
- **Storage**: Monitor database size and growth
- **Backups**: Verify backup completion and test recovery

### Regular Maintenance
- **Dependency Updates**: Keep packages updated for security
- **Performance Review**: Regular performance analysis and optimization
- **Security Audit**: Periodic security reviews and updates
- **Documentation**: Keep deployment documentation current

## Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-id]
```

### Database Rollback
```bash
# Rollback specific migration
npx prisma migrate resolve --rolled-back [migration-name]

# Reset to specific migration
npx prisma migrate reset --to [migration-name]
```

### Emergency Procedures
1. **Immediate Rollback**: Use platform rollback features
2. **Database Recovery**: Restore from backup if needed
3. **Service Communication**: Notify users of any downtime
4. **Root Cause Analysis**: Investigate and document issues