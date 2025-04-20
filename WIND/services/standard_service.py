from WIND.models.models import Standard

class StandardService:
    @staticmethod
    def initialize_default_standards():
        """
        Initialise les standards par défaut si aucun n'existe.
        """
        if Standard.objects.count() == 0:
            default_standards = [
                {
                    "nom": "Standard ISO 9001",
                    "description": "Système de management de la qualité"
                },
                {
                    "nom": "Standard ISO 14001",
                    "description": "Système de management environnemental"
                },
                {
                    "nom": "Standard ISO 45001",
                    "description": "Système de management de la santé et sécurité au travail"
                },
                {
                    "nom": "Standard ISO 27001",
                    "description": "Système de management de la sécurité de l'information"
                },
                {
                    "nom": "Standard ISO 22000",
                    "description": "Système de management de la sécurité des denrées alimentaires"
                }
            ]
            
            for standard_data in default_standards:
                Standard.objects.create(**standard_data)
            
            return True
        return False

    @staticmethod
    def get_all_standards():
        """
        Récupère tous les standards.
        """
        return Standard.objects.all()

    @staticmethod
    def create_standard(nom, description):
        """
        Crée un nouveau standard.
        """
        return Standard.objects.create(
            nom=nom,
            description=description
        ) 