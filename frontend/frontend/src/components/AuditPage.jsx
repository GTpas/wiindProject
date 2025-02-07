import React, {useState} from "react";
import AuditCard from "./AuditCard";
import Footer from "./Footer";

const AuditPage = () => {
    const [activeTab, setActiveTab] = useState("/audit"); // Onglet actif

  return (
    <div className="audit-page">
      <h1>Mes Vérifications</h1>
      <div className="audit-list">
        <AuditCard />
        <AuditCard />
        <AuditCard />
      </div>
        <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default AuditPage;
