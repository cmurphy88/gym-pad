# Database Backup Strategy for Gym Pad

## Overview

This document outlines comprehensive database backup strategies for the Gym Pad application, providing multiple approaches to ensure data protection and recovery capabilities for your PostgreSQL production database.

---

## Current Database Setup Analysis

### Technology Stack
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma 6.12.0
- **Platform**: Vercel deployment
- **Client**: @vercel/postgres 0.10.0

### Database Schema
- **Users**: Authentication and user data
- **Workouts**: Exercise sessions and tracking
- **Exercises**: Individual exercise data with sets/reps
- **Templates**: Reusable workout templates
- **Weight Tracking**: Body weight and goal management
- **Sessions**: User authentication sessions

---

## Backup Strategy Options

### Strategy 1: Manual Backups via pg_dump ⚡ (Immediate Implementation)

**Best for**: Quick setup, on-demand backups, development use

**Advantages:**
- ✅ Simple to implement
- ✅ Standard PostgreSQL tooling
- ✅ Full schema and data export
- ✅ Works with any PostgreSQL host

**Implementation:**

#### A. Backup Script
**File**: `scripts/backup-db.js`
```javascript
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = 'backups'
  const filename = `gym-pad-backup-${timestamp}.sql`
  const filepath = path.join(backupDir, filename)
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  // Extract connection details from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set')
  }
  
  try {
    console.log(`Creating backup: ${filename}`)
    
    // Use pg_dump with connection string
    const command = `pg_dump "${dbUrl}" > "${filepath}"`
    await execAsync(command)
    
    console.log(`✅ Backup created successfully: ${filepath}`)
    console.log(`📊 File size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`)
    
    return filepath
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    throw error
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup()
    .then(filepath => {
      console.log(`\n🎉 Backup completed: ${filepath}`)
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Backup failed:', error)
      process.exit(1)
    })
}

export { createBackup }
```

#### B. Restoration Script
**File**: `scripts/restore-db.js`
```javascript
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import readline from 'readline'

const execAsync = promisify(exec)

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function restoreBackup(backupFile) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set')
  }
  
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`)
  }
  
  console.log(`🔄 Restoring from: ${backupFile}`)
  console.log('⚠️  WARNING: This will overwrite the current database!')
  
  const confirm = await askQuestion('Type "RESTORE" to confirm: ')
  if (confirm !== 'RESTORE') {
    console.log('❌ Restoration cancelled')
    return
  }
  
  try {
    // Restore database
    const command = `psql "${dbUrl}" < "${backupFile}"`
    await execAsync(command)
    
    console.log('✅ Database restored successfully')
  } catch (error) {
    console.error('❌ Restoration failed:', error.message)
    throw error
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFile = process.argv[2]
  
  if (!backupFile) {
    console.error('Usage: node restore-db.js <backup-file>')
    process.exit(1)
  }
  
  restoreBackup(backupFile)
    .then(() => {
      console.log('\n🎉 Restoration completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Restoration failed:', error)
      process.exit(1)
    })
}

export { restoreBackup }
```

#### C. Package.json Scripts
Add to your `package.json`:
```json
{
  "scripts": {
    "backup": "node scripts/backup-db.js",
    "restore": "node scripts/restore-db.js"
  }
}
```

#### D. Usage
```bash
# Create backup
npm run backup

# Restore from backup
npm run restore backups/gym-pad-backup-2024-08-02T10-30-00-000Z.sql
```

---

### Strategy 2: Automated Daily Backups 🤖 (Recommended for Production)

**Best for**: Production environments, hands-off automation, compliance

**Advantages:**
- ✅ Fully automated
- ✅ Consistent backup schedule
- ✅ Cloud storage integration
- ✅ Retention policy management
- ✅ Failure notifications

**Implementation:**

#### A. GitHub Actions Workflow
**File**: `.github/workflows/backup.yml`
```yaml
name: Database Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install PostgreSQL client
      run: |
        sudo apt-get update
        sudo apt-get install -y postgresql-client
        
    - name: Create backup
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        timestamp=$(date +%Y-%m-%d_%H-%M-%S)
        backup_file="gym-pad-backup-${timestamp}.sql"
        
        echo "Creating backup: $backup_file"
        pg_dump "$DATABASE_URL" > "$backup_file"
        
        # Compress backup
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        echo "Backup created: $backup_file"
        echo "BACKUP_FILE=$backup_file" >> $GITHUB_ENV
        
    - name: Upload to GitHub Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: database-backup-${{ github.run_number }}
        path: ${{ env.BACKUP_FILE }}
        retention-days: 30
        
    - name: Upload to AWS S3 (Optional)
      if: ${{ secrets.AWS_ACCESS_KEY_ID }}
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION: us-east-1
        S3_BUCKET: ${{ secrets.S3_BACKUP_BUCKET }}
      run: |
        pip install awscli
        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/gym-pad-backups/"
        
    - name: Cleanup old backups
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION: us-east-1
        S3_BUCKET: ${{ secrets.S3_BACKUP_BUCKET }}
      run: |
        # Keep only last 30 days of backups
        cutoff_date=$(date -d '30 days ago' +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/gym-pad-backups/" | while read -r line; do
          backup_date=$(echo $line | awk '{print $1}')
          if [[ "$backup_date" < "$cutoff_date" ]]; then
            backup_name=$(echo $line | awk '{print $4}')
            echo "Deleting old backup: $backup_name"
            aws s3 rm "s3://$S3_BUCKET/gym-pad-backups/$backup_name"
          fi
        done
        
    - name: Notify on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        text: "🚨 Database backup failed for Gym Pad"
```

#### B. Required GitHub Secrets
Set these in your repository settings:
```
DATABASE_URL              # Production database URL
AWS_ACCESS_KEY_ID          # AWS credentials (optional)
AWS_SECRET_ACCESS_KEY      # AWS credentials (optional)
S3_BACKUP_BUCKET          # S3 bucket name (optional)
SLACK_WEBHOOK             # Slack notifications (optional)
```

---

### Strategy 3: Vercel Postgres Native Backups 🏢 (Platform-Specific)

**Best for**: Vercel-hosted applications, minimal setup

**Vercel Postgres Features:**
- ✅ **Automatic backups**: Built-in daily backups
- ✅ **Point-in-time recovery**: Restore to any point within retention period
- ✅ **Managed service**: No maintenance required
- ✅ **Enterprise features**: Available on Pro/Enterprise plans

**Access Methods:**
1. **Vercel Dashboard**: View backup status and initiate restores
2. **Vercel CLI**: Command-line backup management
3. **API**: Programmatic backup control

**CLI Commands:**
```bash
# List available backups
vercel postgres backup list

# Create manual backup
vercel postgres backup create

# Restore from backup
vercel postgres backup restore <backup-id>

# Download backup
vercel postgres backup download <backup-id>
```

**Limitations:**
- Limited to Vercel infrastructure
- Retention period varies by plan
- Enterprise features require subscription

---

### Strategy 4: Prisma-based Application Backups 💾 (Application-Level)

**Best for**: Application-specific backups, data migration, development

**Advantages:**
- ✅ Application-level consistency
- ✅ Selective data export
- ✅ JSON format for portability
- ✅ Easy to implement
- ✅ No external tools required

**Implementation:**

#### A. Backup API Endpoint
**File**: `app/api/admin/backup/route.js`
```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    
    // Add admin check here if needed
    // if (auth.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }
    
    console.log('Starting database backup...')
    
    // Export all data
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users: await prisma.user.findMany({
          include: {
            sessions: true,
            weightEntries: true,
            weightGoals: true,
            workouts: {
              include: {
                exercises: true,
                exerciseSwaps: true
              }
            }
          }
        }),
        exerciseTemplates: await prisma.exerciseTemplate.findMany(),
        sessionTemplates: await prisma.sessionTemplate.findMany({
          include: {
            templateExercises: true
          }
        })
      }
    }
    
    console.log(`Backup completed: ${Object.keys(backup.data).length} tables`)
    
    // Return as downloadable file
    const filename = `gym-pad-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
    
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json(
      { error: 'Backup failed', details: error.message },
      { status: 500 }
    )
  }
}
```

#### B. Restore API Endpoint
**File**: `app/api/admin/restore/route.js`
```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function POST(request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    
    const backupData = await request.json()
    
    if (!backupData.data || !backupData.version) {
      return NextResponse.json(
        { error: 'Invalid backup format' },
        { status: 400 }
      )
    }
    
    console.log('Starting database restore...')
    
    // Perform restore in transaction
    await prisma.$transaction(async (prisma) => {
      // Clear existing data (be careful!)
      await prisma.session.deleteMany()
      await prisma.exercise.deleteMany()
      await prisma.workout.deleteMany()
      await prisma.weightEntry.deleteMany()
      await prisma.weightGoal.deleteMany()
      await prisma.templateExercise.deleteMany()
      await prisma.sessionTemplate.deleteMany()
      await prisma.exerciseTemplate.deleteMany()
      await prisma.user.deleteMany()
      
      // Restore data
      for (const user of backupData.data.users) {
        await prisma.user.create({
          data: {
            ...user,
            sessions: { create: user.sessions },
            weightEntries: { create: user.weightEntries },
            weightGoals: { create: user.weightGoals },
            workouts: {
              create: user.workouts.map(workout => ({
                ...workout,
                exercises: { create: workout.exercises },
                exerciseSwaps: { create: workout.exerciseSwaps }
              }))
            }
          }
        })
      }
      
      // Restore templates
      await prisma.exerciseTemplate.createMany({
        data: backupData.data.exerciseTemplates
      })
      
      for (const template of backupData.data.sessionTemplates) {
        await prisma.sessionTemplate.create({
          data: {
            ...template,
            templateExercises: { create: template.templateExercises }
          }
        })
      }
    })
    
    console.log('Database restore completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database restored successfully'
    })
    
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json(
      { error: 'Restore failed', details: error.message },
      { status: 500 }
    )
  }
}
```

#### C. Admin Backup Component
**File**: `components/AdminBackup.jsx`
```javascript
import React, { useState } from 'react'
import { DownloadIcon, UploadIcon, DatabaseIcon } from 'lucide-react'

const AdminBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await fetch('/api/admin/backup')
      if (!response.ok) throw new Error('Backup failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gym-pad-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('✅ Backup downloaded successfully!')
    } catch (error) {
      alert('❌ Backup failed: ' + error.message)
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (!confirm('⚠️ This will overwrite ALL data. Are you sure?')) return
    
    setIsRestoring(true)
    try {
      const content = await file.text()
      const backupData = JSON.parse(content)
      
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      })
      
      if (!response.ok) throw new Error('Restore failed')
      
      alert('✅ Database restored successfully!')
      window.location.reload()
    } catch (error) {
      alert('❌ Restore failed: ' + error.message)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <DatabaseIcon className="h-6 w-6 mr-2" />
        Database Backup & Restore
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <DownloadIcon className="h-5 w-5 mr-2" />
          {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
        </button>
        
        <label className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer">
          <UploadIcon className="h-5 w-5 mr-2" />
          {isRestoring ? 'Restoring...' : 'Restore Backup'}
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            disabled={isRestoring}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}

export default AdminBackup
```

---

## Security Considerations

### 1. Environment Variables Protection
```bash
# Never commit these to version control
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 2. Backup Encryption
```javascript
// Encrypt sensitive backups
import crypto from 'crypto'

function encryptBackup(data, password) {
  const cipher = crypto.createCipher('aes-256-cbc', password)
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}
```

### 3. Access Control
- ✅ Admin-only backup endpoints
- ✅ IP whitelist for backup access
- ✅ Rate limiting on backup operations
- ✅ Audit logging for backup activities

### 4. Secure Storage
- ✅ Encrypted cloud storage (AWS S3 with SSE)
- ✅ Private repositories only
- ✅ Limited retention periods
- ✅ Access monitoring and alerts

---

## Monitoring & Alerting

### 1. Backup Success Monitoring
```javascript
// Add to backup scripts
const notify = async (status, message) => {
  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🏋️ Gym Pad Backup ${status}: ${message}`
      })
    })
  }
}
```

### 2. GitHub Actions Notifications
- ✅ Slack integration for failures
- ✅ Email notifications via GitHub
- ✅ Status badges in README
- ✅ Backup size monitoring

### 3. Health Checks
```javascript
// Add backup health check endpoint
export async function GET() {
  const lastBackup = await getLastBackupInfo()
  const hoursAgo = (Date.now() - lastBackup.timestamp) / (1000 * 60 * 60)
  
  return NextResponse.json({
    status: hoursAgo < 25 ? 'healthy' : 'warning',
    lastBackup: lastBackup.timestamp,
    hoursAgo: Math.round(hoursAgo)
  })
}
```

---

## Testing & Validation

### 1. Backup Integrity Testing
```bash
# Test restore in development
npm run backup
npm run restore backups/latest-backup.sql

# Verify data integrity
npm run test:integration
```

### 2. Automated Testing
```javascript
// Add to test suite
describe('Backup System', () => {
  test('creates valid backup', async () => {
    const backup = await createBackup()
    expect(backup).toContain('CREATE TABLE')
    expect(backup).toContain('INSERT INTO')
  })
  
  test('restores data correctly', async () => {
    // Implementation depends on test setup
  })
})
```

### 3. Disaster Recovery Drill
1. **Monthly testing**: Restore to staging environment
2. **Data validation**: Compare restored vs. production data
3. **Performance testing**: Measure backup/restore times
4. **Documentation updates**: Keep procedures current

---

## Implementation Roadmap

### Phase 1: Quick Setup (Week 1)
- [ ] Implement manual backup scripts
- [ ] Add package.json scripts
- [ ] Test backup/restore locally
- [ ] Create initial documentation

### Phase 2: Automation (Week 2)
- [ ] Set up GitHub Actions workflow
- [ ] Configure cloud storage (S3/GitHub Artifacts)
- [ ] Implement retention policies
- [ ] Add failure notifications

### Phase 3: Application Integration (Week 3)
- [ ] Create admin backup endpoints
- [ ] Build backup UI components
- [ ] Add security measures
- [ ] Implement monitoring

### Phase 4: Production Hardening (Week 4)
- [ ] Encrypt sensitive backups
- [ ] Set up monitoring dashboards
- [ ] Document disaster recovery procedures
- [ ] Train team on backup operations

---

## Recommended Approach

### For Immediate Implementation:
1. **Start with Strategy 1** (Manual backups) - Quick setup, immediate protection
2. **Add Strategy 2** (Automated backups) - Long-term reliability
3. **Verify Strategy 3** (Vercel native) - Check your current plan features
4. **Consider Strategy 4** (Application-level) - Additional flexibility

### Best Practice Stack:
```
🔄 Daily automated backups (GitHub Actions + S3)
📱 Manual backup capability (npm scripts)
🏢 Vercel native backups (if available)
💾 Application export feature (for migrations)
📊 Monitoring and alerting (Slack/email)
🔒 Encryption and security (AWS KMS)
```

This multi-layered approach ensures robust data protection with multiple recovery options and minimal single points of failure.

---

## Cost Considerations

### Free Options:
- ✅ GitHub Actions (2000 minutes/month free)
- ✅ GitHub Artifacts storage (500MB free)
- ✅ Manual pg_dump scripts (no cost)

### Paid Options:
- 💰 AWS S3 storage (~$0.023/GB/month)
- 💰 Vercel Pro plan (enhanced backup features)
- 💰 Third-party backup services

### Cost Optimization:
- Compress backups (gzip reduces size by ~90%)
- Implement retention policies
- Use incremental backups for large databases
- Monitor storage usage and costs

---

This comprehensive backup strategy ensures your Gym Pad application data is protected with multiple recovery options, automated processes, and robust monitoring. Choose the combination that best fits your current needs and scale up as your application grows.