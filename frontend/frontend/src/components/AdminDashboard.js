import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    global_stats: {
      total_audits: 0,
      pending_audits: 0,
      in_progress_audits: 0,
      completed_audits: 0,
      delayed_audits: 0,
    },
    operators: [],
    recent_audits: [],
    delayed_audits: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [operatorAudits, setOperatorAudits] = useState([]);
  const [unassignedAudits, setUnassignedAudits] = useState([]);
  const [showUnassignedAudits, setShowUnassignedAudits] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const [pendingOperators, setPendingOperators] = useState([]);
  const [operators, setOperators] = useState([]);
  
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Vérifier le rôle de l'utilisateur
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    console.log("Vérification du rôle utilisateur:", userRole);
    
    if (userRole !== 'admin') {
      console.error("Accès non autorisé - Rôle requis: admin, rôle actuel:", userRole);
      navigate('/signin');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Charger les données du tableau de bord
    fetchDashboardData();
    // Charger les opérateurs (actifs et inactifs)
    fetchOperators();
  }, []);

  // Récupérer les données du tableau de bord
  const fetchDashboardData = () => {
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    console.log("Récupération des données du tableau de bord...");
    
    fetch("http://localhost:8000/api/admin/dashboard/", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Données du tableau de bord reçues:", data);
        setDashboardData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération du tableau de bord:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Récupérer les audits d'un opérateur
  const fetchOperatorAudits = (operatorId) => {
    setLoading(true);
    
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch(`http://localhost:8000/api/admin/operators/${operatorId}/audits/`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Audits de l'opérateur reçus:", data);
        setOperatorAudits(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Récupérer les audits non assignés
  const fetchUnassignedAudits = () => {
    setLoading(true);
    
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch("http://localhost:8000/api/admin/unassigned-audits/", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Audits non assignés reçus:", data);
        setUnassignedAudits(data);
        setShowUnassignedAudits(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Générer des audits pour un opérateur
  const generateAuditsForOperator = (operatorId, nbAudits = 5) => {
    // Vérifier le rôle de l'utilisateur
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      setError("Vous n'avez pas les droits d'administrateur nécessaires.");
      return;
    }
    
    setLoading(true);
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    console.log("Génération d'audits pour l'opérateur:", operatorId);
    
    fetch("http://localhost:8000/api/admin/generate-audits/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
      body: JSON.stringify({ operator_id: operatorId, nb_audits: nbAudits }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            console.error(`Erreur ${res.status}:`, text);
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Audits générés avec succès:", data);
        // Rafraîchir les données
        if (selectedOperator && selectedOperator.user.id === operatorId) {
          fetchOperatorAudits(operatorId);
        }
        // Rafraîchir le tableau de bord
        fetch("http://localhost:8000/api/admin/dashboard/", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
            "X-CSRFToken": csrfToken || ""
          },
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            setDashboardData(data);
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Fonction de déconnexion corrigée
  const handleLogout = () => {
    console.log("Tentative de déconnexion...");
    
    try {
      // Utiliser directement la fonction logout du contexte d'authentification
      logout();
      
      // Nettoyer localStorage manuellement pour s'assurer que tout est bien supprimé
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("csrfToken");
      
      console.log("Déconnexion réussie, redirection vers signin");
      
      // Rediriger vers la page de connexion
      navigate("/signin");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      setError("Erreur lors de la déconnexion");
    }
  };

  // Revenir à la vue globale
  const backToDashboard = () => {
    setSelectedOperator(null);
    setShowUnassignedAudits(false);
  };

  // NOTE: Fonction désactivée car non utilisée actuellement
  // Afficher les détails d'un opérateur
  /*
  const showOperatorDetails = (operator) => {
    setSelectedOperator(operator);
    fetchOperatorAudits(operator.user.id);
    setShowUnassignedAudits(false);
  };
  */

  // Récupérer les opérateurs en attente d'approbation
  const fetchPendingOperators = () => {
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch("http://localhost:8000/api/admin/pending-operators/", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Opérateurs en attente reçus:", data);
        setPendingOperators(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Approuver un opérateur
  const approveOperator = (operatorId) => {
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch(`http://localhost:8000/api/admin/operators/${operatorId}/approve/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Opérateur approuvé:", data);
        // Mettre à jour la liste des opérateurs en attente
        fetchPendingOperators();
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Rejeter un opérateur
  const rejectOperator = (operatorId, reason = "") => {
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch(`http://localhost:8000/api/admin/operators/${operatorId}/reject/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
      body: JSON.stringify({ reason }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Opérateur rejeté:", data);
        // Mettre à jour la liste des opérateurs en attente
        fetchPendingOperators();
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Rafraîchir le tableau de bord
  const refreshDashboard = () => {
    fetchDashboardData();
    fetchOperators();
  };

  // Récupérer les opérateurs (actifs et inactifs)
  const fetchOperators = () => {
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    fetch("http://localhost:8000/api/admin/operators/", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Liste des opérateurs reçue:", data);
        setOperators(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des opérateurs:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Désactiver un compte opérateur
  const disableOperator = (operatorId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver ce compte opérateur?")) {
      return;
    }
    
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    console.log("Désactivation de l'opérateur:", operatorId);
    
    fetch(`http://localhost:8000/api/admin/operators/${operatorId}/disable/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            console.error(`Erreur lors de la désactivation: ${res.status} - ${text}`);
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Opérateur désactivé avec succès:", data);
        alert("Compte opérateur désactivé avec succès");
        
        // Attendre un peu avant de rafraîchir pour laisser le temps à la base de données de se mettre à jour
        setTimeout(() => {
          refreshDashboard();
        }, 500);
      })
      .catch((error) => {
        console.error("Erreur lors de la désactivation:", error);
        alert("Erreur lors de la désactivation: " + error.message);
        setError(error.message);
        setLoading(false);
      });
  };

  // Réactiver un compte opérateur
  const enableOperator = (operatorId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir réactiver ce compte opérateur?")) {
      return;
    }
    
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    console.log("Tentative de réactivation de l'opérateur:", operatorId);
    console.log("Token JWT:", token ? "Présent" : "Absent");
    console.log("CSRF Token:", csrfToken ? csrfToken : "Absent");
    
    const url = `http://localhost:8000/api/admin/operators/${operatorId}/enable/`;
    console.log("URL de la requête:", url);
    
    fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        console.log("Statut de la réponse:", res.status);
        if (!res.ok) {
          return res.text().then(text => {
            console.error(`Erreur lors de la réactivation: ${res.status} - ${text}`);
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Réponse complète:", data);
        console.log("Opérateur réactivé avec succès:", data);
        alert("Compte opérateur réactivé avec succès");
        
        // Attendre un peu avant de rafraîchir pour laisser le temps à la base de données de se mettre à jour
        setTimeout(() => {
          console.log("Rafraîchissement du tableau de bord...");
          refreshDashboard();
        }, 500);
      })
      .catch((error) => {
        console.error("Erreur lors de la réactivation:", error);
        alert("Erreur lors de la réactivation: " + error.message);
        setError(error.message);
        setLoading(false);
      });
  };

  // Supprimer un compte opérateur
  const deleteOperator = (operatorId, operatorName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte de ${operatorName} ? Cette action est irréversible.`)) {
      return;
    }
    
    // Demander une confirmation supplémentaire avec le mot "SUPPRIMER"
    const confirmation = prompt(`Pour confirmer la suppression définitive du compte de ${operatorName}, veuillez saisir "SUPPRIMER" en majuscules:`);
    if (confirmation !== "SUPPRIMER") {
      alert("Suppression annulée.");
      return;
    }
    
    setLoading(true);
    
    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem('token');
    // Récupérer le CSRF token
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    console.log("Suppression de l'opérateur:", operatorId);
    
    fetch(`http://localhost:8000/api/admin/operators/${operatorId}/delete/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "X-CSRFToken": csrfToken || ""
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            console.error(`Erreur lors de la suppression: ${res.status} - ${text}`);
            throw new Error(`Erreur: ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Opérateur supprimé avec succès:", data);
        alert(data.detail || "Compte opérateur supprimé avec succès");
        
        // Rafraîchir immédiatement pour retirer l'opérateur de la liste
        refreshDashboard();
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression: " + error.message);
        setError(error.message);
        setLoading(false);
      });
  };

  // Afficher les détails d'un opérateur
  if (loading && !Object.keys(dashboardData).length) {
    return <div className="loading">Chargement...</div>;
  }

  // Afficher un message d'erreur
  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>{selectedOperator ? `Audits de ${selectedOperator.user.first_name} ${selectedOperator.user.last_name}` : 
          showUnassignedAudits ? "Audits Non Assignés" : "Tableau de Bord Administrateur"}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
      
      {!selectedOperator && !showUnassignedAudits && (
        <div className="tabs">
          <button 
            className={activeTab === 'global' ? 'active' : ''} 
            onClick={() => setActiveTab('global')}>
              Vue Globale
          </button>
          <button 
            className={activeTab === 'unassigned' ? 'active' : ''} 
            onClick={() => {
              setActiveTab('unassigned');
              fetchUnassignedAudits();
            }}>
              Audits Non Assignés
          </button>
          <button 
            className={activeTab === 'pending-operators' ? 'active' : ''} 
            onClick={() => {
              setActiveTab('pending-operators');
              fetchPendingOperators();
            }}>
              Opérateurs en Attente
          </button>
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}
      {error && <div className="error">Erreur: {error}</div>}
      
      {!selectedOperator && !showUnassignedAudits && activeTab === 'global' && (
        <>
          <div className="global-stats">
            <div className="stat-card">
              <h3>Total des Audits</h3>
              <p className="stat-value">{dashboardData.global_stats.total_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Attente</h3>
              <p className="stat-value">{dashboardData.global_stats.pending_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Cours</h3>
              <p className="stat-value">{dashboardData.global_stats.in_progress_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits Terminés</h3>
              <p className="stat-value">{dashboardData.global_stats.completed_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Retard</h3>
              <p className="stat-value">{dashboardData.global_stats.delayed_audits}</p>
            </div>
          </div>
          
          <div className="operators-section">
            <h2>Opérateurs</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date d'inscription</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((operator) => (
                  <tr 
                    key={operator.id} 
                    className={operator.is_active ? "" : "disabled-operator"}
                  >
                    <td>{operator.first_name} {operator.last_name}</td>
                    <td>{operator.email}</td>
                    <td>{operator.date_joined}</td>
                    <td>
                      <span className={`status-badge ${!operator.is_active ? 'inactive-badge' : ''}`}>
                        {operator.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      {operator.is_active ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => disableOperator(operator.id)}
                          disabled={loading}
                        >
                          <i className="fas fa-user-slash mr-1"></i> Désactiver
                        </button>
                      ) : (
                        <button
                          className="btn btn-success btn-sm enable-btn"
                          onClick={() => enableOperator(operator.id)}
                          disabled={loading}
                        >
                          <i className="fas fa-user-check mr-1"></i> Réactiver
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm delete-btn"
                        onClick={() => deleteOperator(operator.id, `${operator.first_name} ${operator.last_name}`)}
                        disabled={loading}
                        title="Supprimer définitivement le compte"
                      >
                        <i className="fas fa-trash-alt mr-1"></i> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="recent-audits">
            <h2>Audits Récents</h2>
            {dashboardData.recent_audits.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Opérateur</th>
                    <th>Statut</th>
                    <th>Date d'échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_audits.map((audit) => (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.title}</td>
                      <td>{audit.assigned_to ? `${audit.assigned_to.first_name} ${audit.assigned_to.last_name}` : "Non assigné"}</td>
                      <td>{audit.status}</td>
                      <td>{new Date(audit.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun audit récent.</p>
            )}
          </div>
          
          <div className="delayed-audits">
            <h2>Audits en Retard</h2>
            {dashboardData.delayed_audits.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Opérateur</th>
                    <th>Statut</th>
                    <th>Date d'échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.delayed_audits.map((audit) => (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.title}</td>
                      <td>{audit.assigned_to ? `${audit.assigned_to.first_name} ${audit.assigned_to.last_name}` : "Non assigné"}</td>
                      <td>{audit.status}</td>
                      <td>{new Date(audit.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun audit en retard.</p>
            )}
          </div>
        </>
      )}
      
      {!selectedOperator && !showUnassignedAudits && activeTab === 'unassigned' && (
        <div className="unassigned-audits">
          <h2>Audits Non Assignés</h2>
          {unassignedAudits.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Date d'échéance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unassignedAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{audit.id}</td>
                    <td>{audit.title}</td>
                    <td>{audit.status}</td>
                    <td>{new Date(audit.due_date).toLocaleDateString()}</td>
                    <td>
                      <button className="assign-btn">Assigner</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun audit non assigné.</p>
          )}
        </div>
      )}
      
      {!selectedOperator && !showUnassignedAudits && activeTab === 'pending-operators' && (
        <div className="pending-operators">
          <h2>Opérateurs en Attente d'Approbation</h2>
          {pendingOperators.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOperators.map((operator) => (
                  <tr key={operator.id}>
                    <td>{operator.first_name} {operator.last_name}</td>
                    <td>{operator.email}</td>
                    <td>{new Date(operator.date_joined).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="approve-btn" 
                        onClick={() => approveOperator(operator.id)}>
                        Approuver
                      </button>
                      <button 
                        className="reject-btn" 
                        onClick={() => {
                          const reason = prompt("Raison du rejet:");
                          if (reason !== null) {
                            rejectOperator(operator.id, reason);
                          }
                        }}>
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun opérateur en attente d'approbation.</p>
          )}
        </div>
      )}
      
      {selectedOperator && (
        <div className="operator-details">
          <div className="operator-header">
            <h2>
              Détails de l'Opérateur: {selectedOperator.user.first_name} {selectedOperator.user.last_name}
            </h2>
            <button onClick={backToDashboard}>Retour</button>
          </div>

          <div className="operator-stats">
            <div className="stat-card">
              <h3>Total des Audits</h3>
              <p>{selectedOperator.stats.audit_count}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Attente</h3>
              <p>{selectedOperator.stats.pending_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Cours</h3>
              <p>{selectedOperator.stats.in_progress_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits Terminés</h3>
              <p>{selectedOperator.stats.completed_audits}</p>
            </div>
            <div className="stat-card">
              <h3>Audits en Retard</h3>
              <p>{selectedOperator.stats.delayed_audits}</p>
            </div>
          </div>

          <div className="operator-actions">
            <button
              onClick={() => generateAuditsForOperator(selectedOperator.user.id)}
              className="generate-btn"
            >
              Générer 5 Audits
            </button>
          </div>

          <div className="operator-audits">
            <h3>Audits de l'Opérateur</h3>
            {operatorAudits.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Date d'échéance</th>
                    <th>Progrès</th>
                  </tr>
                </thead>
                <tbody>
                  {operatorAudits.map((audit) => (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.title}</td>
                      <td>{audit.status}</td>
                      <td>{new Date(audit.due_date).toLocaleDateString()}</td>
                      <td>{audit.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun audit assigné à cet opérateur.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 