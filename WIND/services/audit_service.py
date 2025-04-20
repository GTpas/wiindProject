from datetime import datetime, timedelta
from django.db.models import Q, Count, Avg
from WIND.models.models import Audit, Standard, AuditRepere, ControlRepere
from django.db import transaction
from WIND.services.standard_service import StandardService
from django.utils import timezone
import random

class AuditService:
    @staticmethod
    def get_or_create_audits_for_operator(operator, nb_audits=5):
        """
        Récupère ou crée des audits pour un opérateur.
        
        Args:
            operator: L'utilisateur opérateur
            nb_audits: Nombre d'audits à attribuer si nécessaire
            
        Returns:
            Liste des audits de l'opérateur
        """
        # 1. Récupérer les audits existants de l'opérateur
        operator_audits = Audit.objects.filter(
            assigned_to=operator,
            status__in=['pending', 'in_progress']
        )
        
        # Si l'opérateur a déjà des audits en cours, les renvoyer
        if operator_audits.exists():
            return operator_audits
            
        # 2. S'assurer qu'il y a des standards
        StandardService.initialize_default_standards()
            
        # 3. Chercher des audits non attribués
        with transaction.atomic():
            # Récupérer tous les standards
            standards = list(Standard.objects.all())
            if not standards:
                return []
            
            # Chercher des audits non attribués
            unassigned_audits = Audit.objects.filter(
                assigned_to__isnull=True,
                status='pending'
            )[:nb_audits]
            
            # Si on trouve des audits non attribués, les assigner à l'opérateur
            assigned_audits = []
            for audit in unassigned_audits:
                audit.assigned_to = operator
                audit.save()
                assigned_audits.append(audit)
            
            # S'il n'y a pas assez d'audits non attribués, en créer de nouveaux
            remaining_audits = nb_audits - len(assigned_audits)
            if remaining_audits > 0:
                now = timezone.now()
                
                for i in range(remaining_audits):
                    # Choisir un standard de manière cyclique
                    standard = standards[i % len(standards)]
                    
                    # Créer un nouvel audit
                    audit = Audit.objects.create(
                        title=f"Audit {standard.nom}",
                        type="compliance",
                        assigned_to=operator,
                        due_date=now + timedelta(days=i+7),
                        status='pending',
                        description=f"Audit de conformité pour le standard {standard.nom}",
                        progress=0
                    )
                    audit.standards.add(standard)
                    
                    # Créer des repères pour cet audit
                    AuditService.generate_reperes_for_audit(audit)
                    
                    assigned_audits.append(audit)
            
            return assigned_audits

    @staticmethod
    def get_operator_audits(operator):
        """
        Récupère tous les audits d'un opérateur.
        """
        return Audit.objects.filter(assigned_to=operator).order_by('due_date')

    @staticmethod
    def update_audit_status(audit_id, new_status, operator):
        """
        Met à jour le statut d'un audit.
        """
        try:
            audit = Audit.objects.get(id=audit_id, assigned_to=operator)
            if new_status in dict(Audit.STATUS_CHOICES):
                audit.status = new_status
                if new_status == 'completed':
                    audit.completed_at = timezone.now()
                audit.save()
                return True
            return False
        except Audit.DoesNotExist:
            return False

    @staticmethod
    def generate_reperes_for_audit(audit, nb_reperes=None):
        """
        Génère des repères aléatoires pour un audit.
        
        Args:
            audit: L'audit pour lequel générer des repères
            nb_reperes: Nombre de repères à générer (si None, sera aléatoire)
        """
        # Récupérer le standard associé à l'audit
        standard_name = None
        if audit.standards.exists():
            standard = audit.standards.first()
            standard_name = standard.nom
        
        # Déterminer un nombre aléatoire de repères si non spécifié
        if nb_reperes is None:
            nb_reperes = random.randint(5, 15)
        
        types_machines = [
            "Machine lessiveuse tunnel",
            "Machine lessiveuse barrière",
            "Machine lessiveuse essoreuse",
            "Machine lessiveuse à chargement frontal",
            "Machine lessiveuse à vapeur"
        ]
        
        machine_type = random.choice(types_machines)
        
        if standard_name and "ISO 22000" in standard_name:
            repere_types = [
                "Hygiène du personnel",
                "Contrôle des températures",
                "Traçabilité des aliments",
                "Gestion des allergènes",
                "Procédures de nettoyage",
                "Contrôle des nuisibles",
                "Gestion des déchets",
                "Points critiques HACCP",
                "Surveillance microbiologique",
                "Audit des fournisseurs"
            ]
            
            descriptions_techniques = [
                "Vérifier que le personnel respecte les procédures d'hygiène. Tous les employés doivent porter des équipements de protection appropriés (gants, charlotte, etc.) et suivre les protocoles de lavage des mains.",
                "Contrôler les températures de stockage et de cuisson des aliments. Les réfrigérateurs doivent maintenir une température entre 0°C et 4°C, et les aliments chauds doivent être conservés au-dessus de 63°C.",
                "Examiner le système de traçabilité des aliments. Tous les produits doivent être identifiables depuis leur réception jusqu'à leur distribution avec documentation appropriée.",
                "Vérifier la gestion des allergènes alimentaires. La séparation des allergènes doit être assurée et l'étiquetage doit être conforme à la réglementation en vigueur.",
                "Contrôler les procédures de nettoyage et de désinfection. Les surfaces en contact avec les aliments doivent être nettoyées selon le protocole établi, avec des produits homologués.",
                "Vérifier le programme de lutte contre les nuisibles. Les pièges doivent être correctement placés et régulièrement inspectés, avec documentation des interventions.",
                "Examiner la gestion des déchets alimentaires. Les conteneurs doivent être fermés, clairement identifiés et vidés régulièrement pour éviter la contamination.",
                "Contrôler les points critiques identifiés dans le plan HACCP. Les limites critiques doivent être respectées et les mesures correctives documentées en cas de déviation.",
                "Examiner les résultats des analyses microbiologiques. Les échantillons doivent être prélevés selon le plan d'échantillonnage et les résultats doivent respecter les normes réglementaires.",
                "Vérifier l'évaluation et le suivi des fournisseurs. Les fournisseurs doivent être évalués régulièrement et répondre aux exigences de sécurité alimentaire définies."
            ]
        elif standard_name and "ISO 9001" in standard_name:
            repere_types = [
                "Leadership",
                "Gestion des risques",
                "Satisfaction client",
                "Amélioration continue",
                "Gestion documentaire",
                "Audits internes",
                "Revue de direction",
                "Gestion des non-conformités",
                "Objectifs qualité",
                "Compétences du personnel"
            ]
            
            descriptions_techniques = [
                "Évaluer l'engagement de la direction dans le système de management de la qualité. La politique qualité doit être communiquée et comprise à tous les niveaux de l'organisation.",
                "Vérifier la méthodologie d'identification et de traitement des risques et opportunités. Chaque risque significatif doit avoir un plan d'action associé.",
                "Examiner les processus de mesure de la satisfaction client. Des enquêtes de satisfaction doivent être menées régulièrement et les résultats analysés.",
                "Contrôler la mise en œuvre des actions d'amélioration continue. Les processus d'amélioration doivent être documentés avec des indicateurs de performance.",
                "Vérifier la gestion de la documentation qualité. Tous les documents doivent être à jour, accessibles et contrôlés selon la procédure documentaire.",
                "Examiner le programme d'audits internes. Les audits doivent être planifiés, réalisés par du personnel formé et suivis d'actions correctives.",
                "Contrôler la tenue des revues de direction. Les revues doivent aborder tous les éléments requis par la norme et générer des décisions documentées.",
                "Vérifier la gestion des non-conformités. Chaque non-conformité doit être enregistrée, analysée et suivie jusqu'à résolution.",
                "Examiner les objectifs qualité. Les objectifs doivent être mesurables, suivis et alignés avec la politique qualité de l'organisation.",
                "Contrôler la gestion des compétences du personnel. Les besoins en formation doivent être identifiés, les formations réalisées et leur efficacité évaluée."
            ]
        else:
            audit.title = f"Audit {machine_type}"
            audit.save()
            
            if machine_type == "Machine lessiveuse tunnel":
                repere_types = [
                    "Système de transfert",
                    "Chambre de prélavage",
                    "Chambre de lavage principal",
                    "Chambre de rinçage",
                    "Système de séchage",
                    "Automates programmables",
                    "Pompes de circulation",
                    "Système d'essorage",
                    "Système de filtration",
                    "Convoyeur de sortie"
                ]
                
                descriptions_techniques = [
                    "Vérifier le système de transfert entre les chambres. Les poussoirs hydrauliques doivent opérer sans à-coups avec une pression de 12±1 bars. Les capteurs de position doivent être calibrés avec une précision de ±2mm.",
                    "Contrôler la chambre de prélavage. La température doit être maintenue à 40°C±3°C. Les buses de pulvérisation doivent être exemptes d'obstruction et projeter l'eau selon un angle de 120°.",
                    "Inspecter la chambre de lavage principal. La température doit atteindre 75°C±5°C. Le dosage des produits chimiques doit être précis à ±2ml/kg de linge. Les agitateurs doivent fonctionner à 16-18 cycles par minute.",
                    "Examiner la chambre de rinçage. L'eau doit être claire avec un pH entre 6.5 et 7.5. Le système d'apport d'eau douce doit fournir 30L/min±3L/min. Les buses de rinçage doivent être orientées à 45° par rapport à la rotation du tambour.",
                    "Vérifier le système de séchage par air chaud. La température doit atteindre 120°C±10°C. Le débit d'air doit être de 1500m³/h±100m³/h. Le ventilateur centrifuge doit fonctionner sans vibration excessive (<0.5mm/s).",
                    "Contrôler les automates programmables Siemens S7-1200. Les programmes doivent s'exécuter sans erreur. L'interface HMI doit être fonctionnelle et réactive (temps de réponse <200ms). Les paramètres sauvegardés doivent être correctement chargés au démarrage.",
                    "Examiner les pompes de circulation (type Grundfos CR20-5). Le débit doit être stable à 5m³/h±0.2m³/h. La pression différentielle doit être de 3.5±0.2 bars. L'étanchéité des garnitures mécaniques doit être totale sans fuite.",
                    "Tester le système d'essorage intégré. La vitesse de rotation doit atteindre 400±20 tr/min. Le frein doit arrêter le tambour en moins de 10 secondes. L'évacuation de l'eau doit se faire à 25L/min minimum.",
                    "Inspecter le système de filtration automatique. Les tamis doivent retenir les particules >0.5mm. Le cycle de nettoyage automatique doit se déclencher toutes les 4 heures ou lorsque la pression différentielle atteint 0.8 bar.",
                    "Vérifier le convoyeur de sortie. La vitesse doit être réglable de 2 à 10m/min. Les rouleaux doivent tourner librement. Le système de comptage doit être précis à ±1 unité pour 100 pièces."
                ]
            elif machine_type == "Machine lessiveuse barrière":
                repere_types = [
                    "Tambour bi-compartimenté",
                    "Système de verrouillage inter-zone",
                    "Panneau de contrôle aseptique",
                    "Système de désinfection",
                    "Balance intégrée",
                    "Système de ventilation",
                    "Joints d'étanchéité",
                    "Recyclage d'eau",
                    "Capteurs de température",
                    "Système de traçabilité"
                ]
                
                descriptions_techniques = [
                    "Examiner le tambour bi-compartimenté en acier inoxydable 316L. La rotation doit s'effectuer dans les deux sens à 45±2 tr/min. La capacité nominale est de 70kg par compartiment. L'équilibrage dynamique doit être vérifié (vibration <1mm/s).",
                    "Contrôler le système de verrouillage inter-zone. Les portes côté contaminé et côté propre ne doivent jamais pouvoir s'ouvrir simultanément. La force de verrouillage doit être >500N. Les joints d'étanchéité doivent assurer une isolation complète entre zones.",
                    "Vérifier le panneau de contrôle aseptique. La surface doit être résistante aux produits de désinfection hospitaliers (test avec solution chlorée à 0.5%). Les boutons doivent être étanches IP67. L'écran tactile doit fonctionner avec des gants médicaux.",
                    "Tester le système de désinfection intégré. Le générateur d'ozone doit produire 5g/h±0.5g/h. Le cycle thermique doit maintenir 85°C pendant minimum 15 minutes. La désinfection UV doit émettre à 254nm avec une puissance >40W/m².",
                    "Contrôler la balance intégrée. La précision doit être de ±0.5kg jusqu'à 150kg. Le système de tare doit fonctionner correctement. L'affichage digital doit être lisible à 1.5m de distance minimum.",
                    "Examiner le système de ventilation. L'extraction doit être de 500m³/h±50m³/h. La pression négative doit être maintenue côté contaminé (-15Pa minimum). Les filtres HEPA doivent être intacts et datés du dernier remplacement.",
                    "Vérifier les joints d'étanchéité en silicone médical. L'intégrité doit être complète sans craquelure. La compression doit être uniforme sur tout le périmètre. La résistance à la température doit être garantie jusqu'à 150°C.",
                    "Inspecter le système de recyclage d'eau. Le taux de récupération doit être >30%. La qualité de l'eau recyclée doit répondre aux normes microbiologiques (absence de Pseudomonas aeruginosa). Les filtres à particules doivent être propres.",
                    "Contrôler les capteurs de température PT100. La précision doit être de ±0.5°C sur la plage 20-95°C. L'étalonnage doit être vérifié avec un thermomètre de référence. Le temps de réponse doit être <5 secondes pour une variation de 10°C.",
                    "Examiner le système de traçabilité RFID. La lecture des tags doit être fiable à 99.9%. L'enregistrement des données de cycle (température, durée, produits) doit être complet. L'exportation vers le système informatique hospitalier doit fonctionner sans erreur."
                ]
            elif machine_type == "Machine lessiveuse à chargement frontal":
                repere_types = [
                    "Système de chargement",
                    "Tambour suspendu",
                    "Système de dosage automatique",
                    "Transmission",
                    "Interface utilisateur",
                    "Système de pesée",
                    "Isolation phonique",
                    "Système anti-vibration",
                    "Circuit hydraulique",
                    "Système de sécurité"
                ]
                
                descriptions_techniques = [
                    "Vérifier le système de chargement frontal. La porte doit s'ouvrir à 180° sans contrainte. Le mécanisme d'ouverture doit nécessiter un effort <20N. Le hublot en verre trempé de 15mm doit être intact et la charnière doit supporter 100 000 cycles d'ouverture/fermeture.",
                    "Examiner le tambour suspendu en acier inoxydable 304. L'espace entre tambour et cuve doit être de 12mm±1mm. Les aubes d'entraînement (hauteur 85mm) doivent être solidement fixées. Les trous de perforation doivent mesurer 6mm de diamètre et être exempts d'obstruction.",
                    "Contrôler le système de dosage automatique. Les pompes péristaltiques doivent délivrer 30ml±1ml par injection. Les tuyaux en silicone doivent être souples et sans fissure. Les capteurs de niveau des produits chimiques doivent signaler correctement le niveau bas.",
                    "Inspecter la transmission par courroie Poly-V. La courroie à 6 nervures doit être correctement tendue (fléchissement <8mm sous 5kg). Les poulies ne doivent pas présenter d'usure excessive. L'alignement doit être précis avec un décalage <0.5mm.",
                    "Tester l'interface utilisateur à écran tactile capacitif. La sensibilité doit être uniforme sur toute la surface. Les menus doivent s'afficher en moins de 300ms. L'étalonnage de l'écran doit être précis dans les 4 coins. Les 30 programmes préenregistrés doivent être accessibles.",
                    "Vérifier le système de pesée par cellules de charge. La précision doit être de ±0.2kg jusqu'à 50kg. L'étalonnage doit être vérifié avec des masses certifiées. Le système doit compenser automatiquement la masse du tambour (tare dynamique).",
                    "Examiner l'isolation phonique. Le niveau sonore en fonctionnement ne doit pas dépasser 68dB(A) à 1m. Les panneaux d'isolation doivent être intacts et correctement fixés. Les amortisseurs acoustiques autour du moteur doivent être en bon état.",
                    "Contrôler le système anti-vibration. Les 4 amortisseurs hydrauliques doivent avoir une course de 15mm et être exempts de fuite. Le système d'équilibrage dynamique doit compenser jusqu'à 1.5kg de déséquilibre. Les ancrages au sol doivent être solides.",
                    "Inspecter le circuit hydraulique complexe. Les 6 électrovannes doivent commuter en <200ms. La pression dans le circuit doit être stable à 2.8±0.2 bars. Le débitmètre doit avoir une précision de ±2%. Les tuyaux ne doivent présenter aucune fuite aux raccords.",
                    "Vérifier le système de sécurité multiples. Le verrouillage de porte doit résister à une traction de 200N. La détection de surchauffe doit se déclencher à 110°C±2°C. L'arrêt d'urgence doit couper l'alimentation en <100ms. Le système d'arrêt en cas de balourd excessif (>2kg) doit être fonctionnel."
                ]
            elif machine_type == "Machine lessiveuse à vapeur":
                repere_types = [
                    "Générateur de vapeur",
                    "Système d'injection de vapeur",
                    "Échangeur thermique",
                    "Cuve à double paroi",
                    "Système de récupération de chaleur",
                    "Contrôle de pression",
                    "Traitement d'eau",
                    "Isolation thermique",
                    "Système d'évacuation vapeur",
                    "Régulation électronique"
                ]
                
                descriptions_techniques = [
                    "Inspecter le générateur de vapeur intégré (18kW). La montée en pression doit atteindre 4 bars en moins de 8 minutes. La soupape de sécurité doit s'ouvrir à 5.5±0.2 bars. L'entartrage doit être minimal (<2mm) sur les résistances en Incoloy 800.",
                    "Contrôler le système d'injection de vapeur. Les 6 buses doivent être orientées à 30° vers le linge. Le débit vapeur doit être de 25kg/h±2kg/h. La température au point d'injection doit être de 140°C±5°C. L'homogénéité de la distribution doit être vérifiée.",
                    "Examiner l'échangeur thermique vapeur/eau. Le transfert thermique doit permettre d'atteindre 80°C en moins de 3 minutes. Les plaques en titane doivent être exemptes de corrosion et d'entartrage. Les joints PTFE haute température doivent être intacts.",
                    "Vérifier la cuve à double paroi avec circulation de vapeur. L'uniformité de température sur les parois doit être de ±3°C. L'isolation externe doit limiter la température de surface à 40°C maximum. L'espace inter-paroi de 40mm doit être exempt de condensation.",
                    "Tester le système de récupération de chaleur des condensats. L'efficacité énergétique doit être >85%. La température des eaux usées ne doit pas dépasser 40°C à l'évacuation. Le préchauffage de l'eau d'alimentation doit atteindre 60°C minimum.",
                    "Contrôler les dispositifs de contrôle de pression. Le manomètre doit être précis à ±0.1 bar et étalonné. Le pressostat de sécurité doit couper l'alimentation à 6 bars. Le transducteur de pression électronique doit avoir une précision de ±1.5%.",
                    "Examiner le système de traitement d'eau par adoucisseur. La dureté de l'eau en sortie doit être <3°TH. La capacité d'échange ionique doit être >120°TH.m³. La régénération automatique doit se déclencher après 1500L ou 7 jours maximum.",
                    "Vérifier l'isolation thermique en laine minérale haute densité (120kg/m³). L'épaisseur doit être uniforme (50mm±5mm). La température extérieure du caisson ne doit pas dépasser 35°C avec une température interne de 95°C. Les zones de pontage thermique doivent être identifiées.",
                    "Inspecter le système d'évacuation de vapeur par condenseur. La performance doit permettre une réduction de 95% de la vapeur visible. Le débit d'eau de refroidissement doit être de 15L/min±2L/min. Les ailettes de l'échangeur doivent être propres et non déformées.",
                    "Tester la régulation électronique PID. La stabilité de température doit être de ±1°C en régime établi. Le temps de réponse à une variation de consigne de 10°C doit être <45 secondes. Les paramètres de régulation (P=10, I=120s, D=30s) doivent être vérifiés et optimisés si nécessaire."
                ]
            else:  # Machine lessiveuse essoreuse (par défaut)
                repere_types = [
                    "Tambour de lavage",
                    "Système de chauffage",
                    "Pompe de circulation",
                    "Système d'essorage",
                    "Panneau de commande",
                    "Capteurs de niveau d'eau",
                    "Système d'alimentation en eau",
                    "Système de vidange",
                    "Joints et garnitures",
                    "Moteur principal"
                ]
                
                descriptions_techniques = [
                    "Inspecter le tambour de lavage en acier inoxydable pour détecter tout signe d'usure, de corrosion ou de déformation. Le tambour doit tourner librement sans frottement anormal et l'intérieur doit être exempt de dépôts calcaires. La capacité standard est de 120kg de linge.",
                    "Vérifier le système de chauffage électrique ou à vapeur. Les résistances doivent atteindre 95°C ±3°C pendant la phase de désinfection thermique. Les connexions électriques doivent être sécurisées et le thermostat doit couper l'alimentation à 98°C maximum.",
                    "Examiner la pompe de circulation d'eau (modèle P450) dont le débit nominal est de 250L/min. La pression doit être constante à 4.5 bars durant le cycle de lavage. Vérifier l'absence de fuites au niveau des raccords et l'intégrité des paliers.",
                    "Contrôler le système d'essorage centrifuge. La vitesse maximale doit atteindre 1200 tours/min ±50 tours/min en phase finale. Le frein magnétique doit stopper le tambour en moins de 30 secondes. Les amortisseurs hydrauliques doivent être intacts et sans fuite d'huile.",
                    "Évaluer le panneau de commande électronique et son interface utilisateur. Tous les boutons et écrans tactiles doivent fonctionner correctement. La programmation des 15 cycles préenregistrés doit être accessible et modifiable. Les voyants d'état doivent être fonctionnels.",
                    "Tester les capteurs de niveau d'eau ultrasoniques (modèle ULT-32). La précision doit être de ±2mm pour des mesures entre 0 et 500mm. Le système d'alarme doit se déclencher en cas de remplissage excessif (>520mm) et les connexions électriques doivent être protégées de l'humidité.",
                    "Vérifier le système d'alimentation en eau comprenant les électrovannes d'eau chaude et froide. Le débit d'entrée doit être de 40L/min ±5L/min à 3 bars. Les filtres anti-impuretés doivent être propres et les raccords exempts de fuites.",
                    "Inspecter le système de vidange avec la pompe de vidange (modèle DV-800) et les canalisations. Le débit d'évacuation doit atteindre 70L/min minimum. Les filtres à peluches doivent être nettoyés et la vanne anti-retour doit fonctionner correctement.",
                    "Examiner tous les joints d'étanchéité en EPDM et les garnitures du hublot. La porte doit être parfaitement étanche pendant le cycle (test à 5 bars). Les joints doivent être souples, sans craquelures et le verrouillage de sécurité doit bloquer l'ouverture quand la machine est en fonctionnement.",
                    "Contrôler le moteur principal triphasé (15kW, modèle MT-3450) et sa transmission. Les courroies doivent présenter une tension de 45N ±5N et être sans craquelures. Les roulements doivent fonctionner sans bruit anormal (<80dB) et la température du moteur ne doit pas dépasser 75°C en charge maximale."
                ]
        
        # Supprimer les repères existants pour éviter les duplications
        audit.reperes.all().delete()
        
        # Parfois, répéter certains repères (pour simuler plusieurs contrôles sur le même composant)
        repere_indices = []
        for i in range(nb_reperes):
            # 20% de chance de répéter un repère déjà choisi (s'il y en a)
            if repere_indices and random.random() < 0.2:
                repere_indices.append(random.choice(repere_indices))
            else:
                # S'assurer que l'index est dans les limites
                repere_indices.append(i % len(repere_types))
        
        # Créer les repères
        for i, index in enumerate(repere_indices, 1):
            repere_type = repere_types[index]
            description_technique = descriptions_techniques[index]
            
            # Varier légèrement les valeurs théoriques pour les repères répétés
            valeur_theorique = round(random.uniform(10, 100), 2)
            
            AuditRepere.objects.create(
                audit=audit,
                numero=i,
                nom=f"{repere_type} #{i}",
                valeur_theorique=valeur_theorique,
                description=f"{description_technique} Valeur de référence à vérifier: {valeur_theorique}."
            )

    @staticmethod
    def get_audit_details(audit_id, operator):
        """
        Récupère les détails d'un audit avec ses repères.
        
        Args:
            audit_id: ID de l'audit
            operator: L'opérateur authentifié
            
        Returns:
            Dictionnaire avec les détails de l'audit et ses repères
        """
        try:
            audit = Audit.objects.get(id=audit_id, assigned_to=operator)
            reperes = audit.reperes.all().prefetch_related('controles')
            
            # Calculer la progression en fonction des contrôles effectués
            total_reperes = reperes.count()
            controles_effectues = 0
            
            reperes_data = []
            for repere in reperes:
                controle = repere.controles.first()  # Récupérer le dernier contrôle s'il existe
                if controle:
                    controles_effectues += 1
                
                reperes_data.append({
                    'id': repere.id,
                    'numero': repere.numero,
                    'nom': repere.nom,
                    'valeur_theorique': repere.valeur_theorique,
                    'description': repere.description,
                    'controle': {
                        'id': controle.id if controle else None,
                        'valeur_reelle': controle.valeur_reelle if controle else None,
                        'statut': controle.statut if controle else None,
                        'commentaire': controle.commentaire if controle else '',
                        'image_url': controle.image.url if controle and controle.image else None,
                        'date_controle': controle.date_controle if controle else None
                    } if controle else None
                })
            
            # Mettre à jour la progression de l'audit
            if total_reperes > 0:
                progress = int((controles_effectues / total_reperes) * 100)
                if progress != audit.progress:
                    audit.progress = progress
                    audit.save()
            
            return {
                'audit': {
                    'id': audit.id,
                    'title': audit.title,
                    'type': audit.type,
                    'status': audit.status,
                    'progress': audit.progress,
                    'description': audit.description,
                    'created_at': audit.created_at,
                    'due_date': audit.due_date,
                    'completed_at': audit.completed_at,
                },
                'reperes': reperes_data,
                'total_reperes': total_reperes,
                'controles_effectues': controles_effectues
            }
            
        except Audit.DoesNotExist:
            return None
    
    @staticmethod
    def save_repere_control(repere_id, operator, data):
        """
        Sauvegarde un contrôle de repère.
        
        Args:
            repere_id: ID du repère
            operator: L'opérateur authentifié
            data: Données du contrôle
            
        Returns:
            Le contrôle créé ou mis à jour
        """
        try:
            repere = AuditRepere.objects.select_related('audit').get(
                id=repere_id, 
                audit__assigned_to=operator
            )
            
            # Mettre le statut de l'audit à "in_progress" s'il est en "pending"
            if repere.audit.status == 'pending':
                repere.audit.status = 'in_progress'
                repere.audit.save()
            
            # Créer ou mettre à jour le contrôle
            controle, created = ControlRepere.objects.update_or_create(
                repere=repere,
                defaults={
                    'valeur_reelle': data.get('valeur_reelle'),
                    'statut': data.get('statut'),
                    'commentaire': data.get('commentaire', '')
                }
            )
            
            # Gérer l'image si fournie
            if 'image' in data:
                controle.image = data['image']
                controle.save()
            
            # Mettre à jour la progression de l'audit
            AuditService.update_audit_progress(repere.audit)
            
            return controle
            
        except AuditRepere.DoesNotExist:
            return None
    
    @staticmethod
    def update_audit_progress(audit):
        """
        Met à jour la progression d'un audit en fonction des contrôles effectués.
        
        Args:
            audit: L'audit à mettre à jour
        """
        total_reperes = audit.reperes.count()
        if total_reperes == 0:
            return
            
        # Compter les repères qui ont au moins un contrôle
        reperes_avec_controle = audit.reperes.annotate(
            nb_controles=Count('controles')
        ).filter(nb_controles__gt=0).count()
        
        # Calculer le pourcentage
        progress = int((reperes_avec_controle / total_reperes) * 100)
        
        # Mettre à jour l'audit
        if progress != audit.progress:
            audit.progress = progress
            audit.save()
            
        # Si tous les repères ont été contrôlés, mettre le statut à "completed"
        if progress == 100 and audit.status != 'completed':
            audit.status = 'completed'
            audit.completed_at = timezone.now()
            audit.save()
    
    @staticmethod
    def complete_audit(audit_id, operator):
        """
        Marque un audit comme terminé.
        
        Args:
            audit_id: ID de l'audit
            operator: L'opérateur authentifié
            
        Returns:
            True si l'audit a été marqué comme terminé, False sinon
        """
        try:
            audit = Audit.objects.get(id=audit_id, assigned_to=operator)
            
            # Vérifier que tous les repères ont été contrôlés
            total_reperes = audit.reperes.count()
            reperes_avec_controle = audit.reperes.annotate(
                nb_controles=Count('controles')
            ).filter(nb_controles__gt=0).count()
            
            if reperes_avec_controle < total_reperes:
                return False, "Tous les repères n'ont pas été contrôlés"
            
            # Marquer l'audit comme terminé
            audit.status = 'completed'
            audit.completed_at = timezone.now()
            audit.progress = 100
            audit.save()
            
            return True, "Audit complété avec succès"
            
        except Audit.DoesNotExist:
            return False, "Audit non trouvé" 