import React from "react";
import ReactDOM from "react-dom";
import App from "./App"; // Fichier principal qui gère les routes
import "./index.css";
import reportWebVitals from "./reportWebVitals"; // Fichier pour les styles globaux (si nécessaire)

import { CssBaseline } from '@mui/material';

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline /> {/* Normalize les styles */}
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
