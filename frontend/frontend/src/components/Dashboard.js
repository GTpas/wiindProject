import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // pour rediriger

function Dashboard() {
  const [audits, setAudits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/audits/admin_audits/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAudits(data))
      .catch((error) => console.error("Erreur:", error));
  }, []);

  // Fonction de déconnexion
  const handleLogout = () => {
    // 1) Appeler l'endpoint de déconnexion
    fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur de déconnexion");
        }
        return res.json();
      })
      .then(() => {
        // 2) Nettoyer localStorage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");

        // 3) Rediriger vers la page de connexion
        navigate("/signin");
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h1>Dashboard - Vue Admin</h1>
      <button onClick={handleLogout}>Se déconnecter</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Opérateur</th>
            <th>Standard</th>
            <th>Date Planifiée</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => (
            <tr key={audit.id}>
              <td>{audit.id}</td>
              <td>{audit.operateur?.email}</td>
              <td>{audit.standard?.nom}</td>
              <td>{audit.date_planifiee}</td>
              <td>{audit.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
