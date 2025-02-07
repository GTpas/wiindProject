import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import "../styles/Footer.css";
import Footer from "./Footer";
import LoginIcon from "@mui/icons-material/Login";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("/");
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* En-tête */}
      <header className="homepage-header">
        <div className="logo-container">
          <img src={process.env.PUBLIC_URL + "../assets/Logo_WIND.png"} alt="Logo associé" className="logo" />
        </div>
        <div className="account-icon-container">
          <button className="account-button" onClick={() => navigate("/login")}>
            <LoginIcon className="account-icon" />
          </button>
          <p className="account-text">Connexion / Inscription</p>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="homepage-content">
        <h1>Project WIND 2025</h1>
      </main>

      {/* Footer commun */}
      <Footer activeTab="home" setActiveTab={setActiveTab} />
    </div>
  );
};

export default HomePage;
