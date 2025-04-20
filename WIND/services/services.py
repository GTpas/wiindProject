from WIND.models.models import Audit, Standard
from django.contrib.auth import get_user_model  # ✅ Utilisation de get_user_model()
from datetime import date
import random

User = get_user_model()  # ✅ Récupère automatiquement le modèle `Utilisateur`

def generer_audits():
    """ Génère aléatoirement des audits pour les opérateurs """
    operateurs = list(User.objects.filter(role='operateur'))  # ✅ Utilisation du champ `role` au lieu de `groups`
    standards = list(Standard.objects.all())

    if not operateurs or not standards:
        return "Pas assez de données pour générer les audits"

    Audit.objects.all().delete()  # Supprime les audits existants

    # Génération des audits en évitant les doublons
    random.shuffle(standards)
    audit_assignations = {op.id: [] for op in operateurs}

    for standard in standards:
        random.shuffle(operateurs)
        for operateur in operateurs:
            if standard.id not in audit_assignations[operateur.id]:
                Audit.objects.create(
                    operateur=operateur,
                    date_planifiee=date.today(),
                    standard=standard,
                    status="A FAIRE"
                )
                audit_assignations[operateur.id].append(standard.id)
                break  # Évite la duplication

    return "Génération des audits terminée"
