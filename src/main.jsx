// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'react-image-crop/dist/ReactCrop.css'   // ⬅️ tetap di sini
import './index.css'                           // ⬅️ tetap terakhir
import App from './App.jsx'
import { RACProvider } from './context/RACContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RACProvider>
        <App />   {/* ✅ Router di App.jsx yang urus Routes */}
      </RACProvider>
    </BrowserRouter>
  </React.StrictMode>
)
