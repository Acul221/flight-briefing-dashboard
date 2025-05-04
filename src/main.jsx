import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { RACProvider } from './context/RACContext.jsx'; // Pastikan path ini sesuai

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
);
