import React from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="homepage-header">
      <div className="logo-container">
        <img src={process.env.PUBLIC_URL + "../assets/Logo_WIND.png"} alt="Logo associé" className="logo" />
      </div>
      <div className="account-icon-container">
        {isLoggedIn ? (
          <button className="account-button" onClick={onLogout}>
            <LogoutIcon className="account-icon" />
          </button>
        ) : (
          <button className="account-button" onClick={() => navigate("/login")}>
            <AccountCircleIcon className="account-icon" />
          </button>
        )}
        <p className="account-text">{isLoggedIn ? "Déconnexion" : "Connexion / Inscription"}</p>
      </div>
    </header>
  );
};

export default Header;
