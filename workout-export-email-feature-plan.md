# Workout Export & Email Feature Implementation Plan

## Overview

This document outlines the implementation plan for adding workout download and email functionality to Gym Pad, enabling users to export their completed workout sessions in multiple formats and share them via email.

---

## Feature Specifications

### Feature 1: Workout Download/Export
**Goal**: Allow users to download their workout sessions in various formats for personal records, sharing, or data analysis.

**Supported Export Formats**:
- **PDF**: Professional, printable workout report
- **CSV**: Spreadsheet-compatible data for analysis
- **JSON**: Raw data format for developers/integrations
- **TXT**: Simple, readable text format for gym notes

### Feature 2: Email Workout Session
**Goal**: Enable users to email their completed workouts to themselves, trainers, or workout partners.

**Email Features**:
- Beautiful HTML email template with workout summary
- Option to include detailed exercise breakdown
- Support for custom recipient and message
- Rate limiting and spam protection

---

## Technical Implementation

### 1. Frontend Components

#### A. SessionDetail Component Modifications
**File**: `components/SessionDetail.jsx`

**Changes**:
```jsx
// Add new buttons to header section (lines 40-48)
<div className="flex gap-2">
  <button
    onClick={handleDownload}
    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
  >
    <DownloadIcon className="h-4 w-4 mr-2" />
    Download
  </button>
  <button
    onClick={handleEmail}
    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
  >
    <MailIcon className="h-4 w-4 mr-2" />
    Email
  </button>
  <button
    onClick={onEdit}
    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
  >
    <EditIcon className="h-4 w-4 mr-2" />
    Edit Session
  </button>
</div>
```

#### B. Download Format Selector Modal
**New File**: `components/DownloadModal.jsx`

```jsx
const DownloadModal = ({ isOpen, onClose, session, onDownload }) => {
  const formats = [
    { key: 'pdf', label: 'PDF Document', icon: FileTextIcon, description: 'Professional printable report' },
    { key: 'csv', label: 'CSV Spreadsheet', icon: TableIcon, description: 'Data for Excel/Sheets analysis' },
    { key: 'json', label: 'JSON Data', icon: CodeIcon, description: 'Raw data format' },
    { key: 'txt', label: 'Text File', icon: FileIcon, description: 'Simple readable format' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Download Workout</h3>
        <p className="text-gray-400">Choose a format to download your workout session.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formats.map(format => (
            <button
              key={format.key}
              onClick={() => onDownload(format.key)}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <format.icon className="h-6 w-6 text-purple-400" />
                <div>
                  <div className="font-medium text-white">{format.label}</div>
                  <div className="text-sm text-gray-400">{format.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
```

#### C. Email Workout Modal
**New File**: `components/EmailModal.jsx`

```jsx
const EmailModal = ({ isOpen, onClose, session, onSendEmail }) => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSendEmail({ email, message })
      onClose()
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Email Workout</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="trainer@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Here's my latest workout session..."
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

### 2. Utility Functions

#### A. Workout Export Functions
**New File**: `lib/workout-export.js`

```javascript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const exportWorkoutPDF = (session) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text(session.title, 20, 30)
  
  doc.setFontSize(12)
  doc.text(`Date: ${new Date(session.date).toLocaleDateString()}`, 20, 45)
  
  if (session.notes) {
    doc.text(`Notes: ${session.notes}`, 20, 55)
  }
  
  // Exercise tables
  let yPosition = 70
  session.exercises?.forEach((exercise, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 30
    }
    
    doc.setFontSize(14)
    doc.text(`${index + 1}. ${exercise.name}`, 20, yPosition)
    yPosition += 10
    
    // Sets table
    const tableData = exercise.sets?.map((set, setIndex) => [
      `Set ${setIndex + 1}`,
      set.weight ? `${set.weight} kg` : 'BW',
      `${set.reps} reps`
    ]) || []
    
    doc.autoTable({
      startY: yPosition,
      head: [['Set', 'Weight', 'Reps']],
      body: tableData,
      margin: { left: 20 },
      theme: 'grid'
    })
    
    yPosition = doc.lastAutoTable.finalY + 15
  })
  
  // Save the PDF
  doc.save(`${session.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}

export const exportWorkoutCSV = (session) => {
  const csvData = []
  
  // Header row
  csvData.push(['Date', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'Notes'])
  
  session.exercises?.forEach(exercise => {
    exercise.sets?.forEach((set, setIndex) => {
      csvData.push([
        new Date(session.date).toLocaleDateString(),
        exercise.name,
        setIndex + 1,
        set.weight || 0,
        set.reps,
        exercise.notes || ''
      ])
    })
  })
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  downloadFile(csvContent, `${session.title.replace(/[^a-z0-9]/gi, '_')}.csv`, 'text/csv')
}

export const exportWorkoutJSON = (session) => {
  const jsonContent = JSON.stringify(session, null, 2)
  downloadFile(jsonContent, `${session.title.replace(/[^a-z0-9]/gi, '_')}.json`, 'application/json')
}

export const exportWorkoutTXT = (session) => {
  let content = `${session.title}\n`
  content += `Date: ${new Date(session.date).toLocaleDateString()}\n`
  content += `${'='.repeat(40)}\n\n`
  
  if (session.notes) {
    content += `Notes: ${session.notes}\n\n`
  }
  
  session.exercises?.forEach((exercise, index) => {
    content += `${index + 1}. ${exercise.name}\n`
    if (exercise.notes) {
      content += `   Notes: ${exercise.notes}\n`
    }
    
    exercise.sets?.forEach((set, setIndex) => {
      content += `   Set ${setIndex + 1}: ${set.weight ? set.weight + ' kg' : 'BW'} x ${set.reps} reps\n`
    })
    content += '\n'
  })
  
  // Summary
  const totalSets = session.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0
  const totalReps = session.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => setSum + (set.reps || 0), 0) || 0), 0
  ) || 0
  const totalVolume = session.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0
  ) || 0
  
  content += `Summary:\n`
  content += `- Exercises: ${session.exercises?.length || 0}\n`
  content += `- Total Sets: ${totalSets}\n`
  content += `- Total Reps: ${totalReps}\n`
  content += `- Total Volume: ${totalVolume} kg\n`
  
  downloadFile(content, `${session.title.replace(/[^a-z0-9]/gi, '_')}.txt`, 'text/plain')
}

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

#### B. Email Templates
**New File**: `lib/email-templates.js`

```javascript
export const generateWorkoutEmailHTML = (session, customMessage = '') => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalSets = session.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0
  const totalReps = session.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => setSum + (set.reps || 0), 0) || 0), 0
  ) || 0
  const totalVolume = session.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0
  ) || 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workout Session: ${session.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .exercise { margin: 20px 0; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .exercise-name { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 10px; }
        .sets-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .sets-table th, .sets-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .sets-table th { background-color: #f8f9fa; font-weight: bold; }
        .message { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${session.title}</h1>
        <p>${formatDate(session.date)}</p>
      </div>

      ${customMessage ? `
        <div class="message">
          <strong>Message:</strong> ${customMessage}
        </div>
      ` : ''}

      <div class="summary">
        <div class="stat">
          <div class="stat-number">${session.exercises?.length || 0}</div>
          <div>Exercises</div>
        </div>
        <div class="stat">
          <div class="stat-number">${totalSets}</div>
          <div>Total Sets</div>
        </div>
        <div class="stat">
          <div class="stat-number">${totalReps}</div>
          <div>Total Reps</div>
        </div>
        <div class="stat">
          <div class="stat-number">${totalVolume}</div>
          <div>Volume (kg)</div>
        </div>
      </div>

      ${session.notes ? `
        <div class="exercise">
          <strong>Session Notes:</strong> ${session.notes}
        </div>
      ` : ''}

      <h2>Exercises</h2>
      ${session.exercises?.map((exercise, index) => `
        <div class="exercise">
          <div class="exercise-name">${index + 1}. ${exercise.name}</div>
          ${exercise.notes ? `<p><em>${exercise.notes}</em></p>` : ''}
          
          <table class="sets-table">
            <thead>
              <tr>
                <th>Set</th>
                <th>Weight</th>
                <th>Reps</th>
              </tr>
            </thead>
            <tbody>
              ${exercise.sets?.map((set, setIndex) => `
                <tr>
                  <td>#${setIndex + 1}</td>
                  <td>${set.weight ? set.weight + ' kg' : 'BW'}</td>
                  <td>${set.reps}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>
      `).join('') || ''}

      <div class="footer">
        <p>Generated by Gym Pad - Your Fitness Journey Tracker</p>
        <p><em>Keep pushing your limits! 💪</em></p>
      </div>
    </body>
    </html>
  `
}
```

### 3. Backend API

#### Email API Endpoint
**New File**: `app/api/workouts/[id]/email/route.js`

```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { generateWorkoutEmailHTML } from '@/lib/email-templates'
import nodemailer from 'nodemailer'

// Rate limiting map (in production, use Redis)
const emailRateLimit = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_EMAILS_PER_WINDOW = 5

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    
    const { email, message } = await request.json()
    const workoutId = parseInt(params.id)
    
    // Input validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }
    
    // Rate limiting
    const userId = auth.user.id
    const now = Date.now()
    const userKey = `${userId}`
    
    if (!emailRateLimit.has(userKey)) {
      emailRateLimit.set(userKey, [])
    }
    
    const userRequests = emailRateLimit.get(userKey)
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW)
    
    if (recentRequests.length >= MAX_EMAILS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another email.' },
        { status: 429 }
      )
    }
    
    recentRequests.push(now)
    emailRateLimit.set(userKey, recentRequests)
    
    // Fetch workout data
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: auth.user.id
      },
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })
    
    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    
    // Parse exercise sets data
    const workoutWithParsedSets = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: JSON.parse(exercise.setsData || '[]')
      }))
    }
    
    // Generate email content
    const htmlContent = generateWorkoutEmailHTML(workoutWithParsedSets, message)
    
    // Configure email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Workout Session: ${workout.title}`,
      html: htmlContent
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    })
    
  } catch (error) {
    console.error('Error sending workout email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
```

### 4. Package Dependencies

#### Required NPM Packages
**Update**: `package.json`

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.6.0",
    "nodemailer": "^6.9.7"
  }
}
```

---

## Environment Variables

Add to `.env.local` for email functionality:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Gym Pad <your-email@gmail.com>
```

---

## Security Considerations

### Rate Limiting
- **Email**: 5 emails per minute per user
- **Download**: No limit (client-side generation)
- **IP-based limiting** for additional protection

### Data Privacy
- **No data storage** of exported content on server
- **Email validation** to prevent spam
- **Authentication required** for all export/email functions

### Input Sanitization
- **Email validation** using regex and built-in validation
- **Message content filtering** to prevent injection attacks
- **File name sanitization** for downloads

---

## Testing Strategy

### Unit Tests
- Export function validation (PDF, CSV, JSON, TXT)
- Email template generation
- Rate limiting logic

### Integration Tests
- End-to-end email sending
- Download functionality across browsers
- Mobile responsiveness of modals

### Manual Testing Checklist
- [ ] PDF export renders correctly
- [ ] CSV opens properly in Excel/Sheets
- [ ] JSON export is valid
- [ ] TXT format is readable
- [ ] Email delivers with correct formatting
- [ ] Rate limiting prevents spam
- [ ] Mobile download/email works
- [ ] Error handling displays appropriately

---

## Implementation Timeline

### Phase 1: Download Functionality (Week 1)
1. Create export utility functions
2. Add download modal component
3. Integrate download button in SessionDetail
4. Test all export formats

### Phase 2: Email Functionality (Week 2)
1. Set up email service configuration
2. Create email templates
3. Build email API endpoint
4. Add email modal component
5. Implement rate limiting

### Phase 3: Polish & Testing (Week 3)
1. UI/UX refinements
2. Comprehensive testing
3. Mobile optimization
4. Error handling improvements
5. Documentation updates

---

## User Experience Flow

### Download Flow
1. User clicks "Download" button on session detail page
2. Download modal opens with format options
3. User selects desired format (PDF, CSV, JSON, TXT)
4. File generates and downloads automatically
5. Success toast notification appears

### Email Flow
1. User clicks "Email" button on session detail page  
2. Email modal opens with recipient and message fields
3. User enters email address and optional message
4. System validates input and checks rate limits
5. Email sends with formatted workout content
6. Success/error notification displays

---

## Future Enhancements

### Advanced Features
- **Bulk export** - Download multiple sessions at once
- **Email scheduling** - Schedule recurring workout summaries
- **Social sharing** - Share workouts on social media platforms
- **Print optimization** - Better print layouts for PDF exports
- **Cloud storage** - Export directly to Google Drive/Dropbox

### Analytics Integration
- **Export tracking** - Monitor which formats are most popular
- **Email metrics** - Track email delivery and engagement
- **User behavior** - Analyze export patterns for UX improvements

---

This comprehensive plan provides a roadmap for implementing robust workout export and email functionality that enhances user engagement and provides practical value for fitness tracking and sharing.