import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a855f7', // purple-500
          borderRadius: 32,
        }}
      >
        {/* Larger dumbbell for Apple icon */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            background: '#a855f7', 
            borderRadius: '50%' 
          }} />
          <div style={{ 
            width: 48, 
            height: 12, 
            background: '#a855f7', 
            margin: '0 8px' 
          }} />
          <div style={{ 
            width: 32, 
            height: 32, 
            background: '#a855f7', 
            borderRadius: '50%' 
          }} />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}