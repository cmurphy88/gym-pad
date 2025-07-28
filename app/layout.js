import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: 'Gym Pad - Your Workout Tracker',
  description: 'Track your gym sessions, monitor exercise progress, and visualize your fitness journey',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}