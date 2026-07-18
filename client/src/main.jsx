import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { SocketProvider } from './context/SocketContext'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1E293B',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              border: '1px solid #F1F5F9',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
