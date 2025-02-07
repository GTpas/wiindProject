 import React, { useState } from 'react';

const AuditCard = () => {
  const [status, setStatus] = useState(""); // Stocke l'état sélectionné
  const [comments, setComments] = useState(""); // Stocke les commentaires
  const [image, setImage] = useState(null); // Stocke l'image sélectionnée

  // Gestion de l'upload d'image
  const handleImageUpload = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  return (
    <div className="audit-card">
      {/* Titre de la carte */}
      <h3>Carte 1 - Machine XYZ</h3>
      <p>Points à vérifier : Sécurité, Qualité</p>

      {/* Options de validation */}
      <div className="validation-options">
        <label>
          <input
            type="radio"
            name="status"
            value="OK"
            onChange={(e) => setStatus(e.target.value)}
          />
          OK
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="Non-OK"
            onChange={(e) => setStatus(e.target.value)}
          />
          Non-OK
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="NA"
            onChange={(e) => setStatus(e.target.value)}
          />
          Non Applicable
        </label>
      </div>

      {/* Zone de commentaires */}
      <div className="comments-section">
        <textarea
          placeholder="Décrire les non-conformités ici..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      {/* Ajout de photo */}
      <div className="photo-upload">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && <img src={image} alt="Uploaded" className="uploaded-image" />}
      </div>

      {/* Bouton de soumission */}
      <button onClick={() => alert(`Statut : ${status}, Commentaire : ${comments}`)}>
        Soumettre
      </button>
    </div>
  );
};

export default AuditCard;
