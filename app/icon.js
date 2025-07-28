import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a855f7', // purple-500
        }}
      >
        {/* Simple dumbbell representation */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            background: '#a855f7', 
            borderRadius: '50%' 
          }} />
          <div style={{ 
            width: 12, 
            height: 3, 
            background: '#a855f7', 
            margin: '0 2px' 
          }} />
          <div style={{ 
            width: 8, 
            height: 8, 
            background: '#a855f7', 
            borderRadius: '50%' 
          }} />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}