import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = () => {
    alert("Vous êtes déconnecté.");
  };

  return (
    <div className="login-page">
      {/* Header commun */}
      <Header isLoggedIn={false} onLogout={handleLogout} />

      {/* Contenu principal */}
      <main className="login-main-content">
        <h1>Connexion / Inscription</h1>
        <form className="login-form">
          <label>
            Nom d'utilisateur :
            <input type="text" placeholder="Entrez votre nom d'utilisateur" />
          </label>
          <label>
            Mot de passe :
            <input type="password" placeholder="Entrez votre mot de passe" />
          </label>
          <button type="submit">Se connecter</button>
          <button type="button">S'inscrire</button>
        </form>
      </main>

      {/* Footer commun */}
      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default LoginPage;
