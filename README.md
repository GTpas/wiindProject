# WIIND 2025 - Système de Gestion des Audits Industriels


## À propos du projet

WIIND 2025 est une application web conçue pour moderniser et optimiser le processus d'audit dans les environnements industriels. Développée dans le cadre d'un hackathon Industry 4.0 en collaboration avec Lesieur, cette solution numérique vise à remplacer les processus manuels traditionnels par un système de gestion d'audits intelligent et intuitif.

## Caractéristiques principales

- **Planification et suivi des audits** : Création, assignation et suivi des audits selon les normes SQCDMEE (Sécurité, Qualité, Coûts, Délais, Motivation, Environnement, Énergie)
- **Tableaux de bord interactifs** : Visualisation en temps réel de l'état des audits, statistiques et indicateurs de performance
- **Gestion des non-conformités** : Suivi systématique des problèmes identifiés et des actions correctives
- **Authentification sécurisée** : Système de connexion multi-niveaux avec activation par code pour les opérateurs
- **Compatibilité mobile** : Interface responsive adaptée à l'utilisation sur le terrain

## Technologies utilisées

### Backend
- Django (Python)
- Django REST Framework
- SQLite (base de données)
- JWT pour l'authentification

### Frontend
- React.js
- Material-UI
- Axios
- Chart.js pour les visualisations

## Prérequis

- Python 3.8 ou supérieur
- Node.js 14 ou supérieur
- npm ou yarn

## Installation

### Configuration du Backend

1. Cloner le dépôt
   ```
   git clone https://github.com/GTpas/wiindProject.git
   cd wiindProject
   ```

2. Créer un environnement virtuel
   ```
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   ```

3. Installer les dépendances
   ```
   pip install -r requirements.txt
   ```

4. Créer un fichier local_settings.py dans le dossier djangoProject
   ```python
   # Créer le fichier djangoProject/local_settings.py avec:
   SECRET_KEY = 'django-insecure-01p^#zjar3%odw@&@m%db!v@6127ckehe^9eos4w3hag1-wtg*'
   GOOGLE_CLIENT_ID = '154290529171-6ahfbu70u3e41k922lr1glmnh3lqjfs8.apps.googleusercontent.com'
   GOOGLE_CLIENT_SECRET = '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'
   EMAIL_HOST_PASSWORD = 'wfarkhewnnvugjsg'
   DEBUG = True
   ```

5. Appliquer les migrations
   ```
   python manage.py migrate
   ```

6. Créer un superutilisateur
   ```
   python manage.py createsuperuser
   ```

7. Démarrer le serveur backend
   ```
   python manage.py runserver
   ```

### Configuration du Frontend

1. Naviguer vers le dossier frontend
   ```
   cd frontend/frontend
   ```

2. Installer les dépendances
   ```
   npm install
   ```

3. Démarrer l'application React
   ```
   npm start
   ```

## Structure du projet

```
wiindProject/
├── djangoProject/        # Configuration Django principale
├── WIND/                 # Application principale 
├── users/                # Gestion des utilisateurs
├── frontend/            
│   └── frontend/         # Application React
├── static/               # Fichiers statiques
├── media/                # Fichiers média uploadés
└── requirements.txt      # Dépendances Python
```

## Utilisation

1. Accéder à l'application: http://localhost:3000
2. Se connecter avec les identifiants créés ou utiliser le compte superutilisateur
3. Explorer les différentes fonctionnalités via le menu principal:
   - Dashboard
   - Gestion des audits
   - Gestion des utilisateurs (admin)
   - Rapports et statistiques



## Auteurs

- [Équipe WIIND 2025]
