# Horbox 🎵

A private, password-protected web application for Ocin & Salma to share memories, playlists, messages, and moments together.

## Features

- **Password Gate**: Secure access with environment-based authentication
- **YouTube Playlist Manager**: Create playlists, add songs with messages, and play directly in the app
- **Message Board**: Share sweet messages and thoughts in real-time
- **Photo & Video Gallery**: Browse and view your shared memories with search and sorting
- **Our Assets**: Directory of shared projects and links
- **Rest Page**: Built-in music player with custom controls
- **Lite Mode**: Toggle between video and static backgrounds for performance

## Tech Stack

- **React 19** - Latest React with lazy loading and performance optimizations
- **Vite 7** - Fast build tool with optimized chunk splitting
- **Firebase Realtime Database** - Real-time data synchronization
- **React Router 7** - Client-side routing with protected routes
- **Custom CSS** - Glassmorphism design with smooth animations

## Performance Optimizations

✅ Lazy-loaded route components  
✅ Code splitting with manual chunks for vendors  
✅ React.memo for frequently rendered components  
✅ useCallback for event handlers  
✅ Error boundaries for graceful error handling  
✅ Toast notifications for user feedback  
✅ Optimized image loading with lazy/async attributes  
✅ Reduced motion support for accessibility  

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file with your Firebase config:
```env
VITE_GATE_PWD=your-password
VITE_FB_API_KEY=your-firebase-api-key
VITE_FB_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-app.appspot.com
VITE_FB_MESSAGING_SENDER_ID=123456789
VITE_FB_APP_ID=your-app-id
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment

Configured for Netlify with SPA routing. The `netlify.toml` handles redirects for client-side routing.

## Project Structure

```
src/
├── components/       # Reusable components (ErrorBoundary, Toast, BackgroundVideo)
├── pages/           # Route pages
├── styles/          # CSS modules and global styles
├── firebase.js      # Firebase configuration
└── App.jsx         # Main app with routing
```

---

Made with ❤️ for Ocin & Salma
