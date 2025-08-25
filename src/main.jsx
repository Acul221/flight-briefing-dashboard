// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'react-image-crop/dist/ReactCrop.css'   // ⬅️ tambahkan di sini
import './index.css'                           // tetap terakhir agar bisa override
import App from './App.jsx'
import { RACProvider } from './context/RACContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RACProvider>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </RACProvider>
    </BrowserRouter>
  </React.StrictMode>
)
