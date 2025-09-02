// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RACProvider } from "./context/RACContext.jsx";

import "react-image-crop/dist/ReactCrop.css";
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <RACProvider>
          <App />
        </RACProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
