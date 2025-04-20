import React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import LoginIcon from "@mui/icons-material/Login";
import "../styles/Footer.css";

const Footer = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Récupérer l'URL actuelle

  const handleNavigation = (route) => {
    setActiveTab(route);
    navigate(route);
  };

    // Ne pas afficher le footer sur certaines pages (ex: HomePage)
  if (location.pathname === "/") {
    return null;
  }

  return (
    <footer className="footer">
      <button
        className={`nav-icon ${activeTab === "/" ? "active" : ""}`}
        onClick={() => handleNavigation("/")}
        title="Accueil"
      >
        <HomeIcon />
      </button>
      <button
        className={`nav-icon ${activeTab === "/audit" ? "active" : ""}`}
        onClick={() => handleNavigation("/audit")}
        title="Audit"
      >
        <SearchIcon />
      </button>
      <button
        className={`nav-icon ${activeTab === "/login" ? "active" : ""}`}
        onClick={() => handleNavigation("/login")}
        title="Connexion"
      >
        <LoginIcon />
      </button>
    </footer>
  );
};

export default Footer;
