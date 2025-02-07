import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import AuditPage from "./components/AuditPage";
import Footer from "./components/Footer";

const App = () => {
    const [activeTab, setActiveTab] = useState("/");
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/audit" element={<AuditPage />} /> {/* Route pour audit */}
        </Routes>
        <Footer activeTab={activeTab} setActiveTab={setActiveTab}/>
      </div>
    </Router>
  );
};

export default App;
