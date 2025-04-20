from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'email est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Le superuser doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Le superuser doit avoir is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class Utilisateur(AbstractUser):
    USER_ROLES = (
        ('admin', 'Administrateur'),
        ('operateur', 'Opérateur'),
    )
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    role = models.CharField(max_length=10, choices=USER_ROLES, default='operateur')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    username = None  # Désactive le champ username
    
    # Champs pour la validation en deux étapes
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, null=True, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    admin_approved = models.BooleanField(default=False)
    approval_code = models.CharField(max_length=20, null=True, blank=True)
    approval_code_sent_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UtilisateurManager()

    def save(self, *args, **kwargs):
        # Ajout d'un log pour la désactivation
        if self.pk:
            # Si l'objet existe déjà, vérifions si is_active a changé
            try:
                old_instance = Utilisateur.objects.get(pk=self.pk)
                if old_instance.is_active and not self.is_active:
                    print(f"DÉSACTIVATION: Le compte de l'utilisateur {self.email} va être désactivé.")
                elif not old_instance.is_active and self.is_active:
                    print(f"RÉACTIVATION: Le compte de l'utilisateur {self.email} va être réactivé.")
            except Utilisateur.DoesNotExist:
                pass
        
        # Appeler la méthode save d'origine
        super().save(*args, **kwargs)
        print(f"Utilisateur {self.email} sauvegardé avec is_active={self.is_active}")

    @property
    def is_fully_verified(self):
        """Vérifie si l'utilisateur a complété les deux étapes de vérification"""
        if self.role == 'admin':
            return True
        return self.email_verified and self.admin_approved

class Standard(models.Model):
    """ Liste des standards d'audit à contrôler """
    nom = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=[
            ('OK', 'OK'),
            ('NOK', 'Non OK'),
            ('NA', 'Non Applicable')
        ],
        null=True,
        blank=True
    )
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Standard {self.id}: {self.description[:50]}..."

class Audit(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminé'),
        ('delayed', 'En retard'),
    )
    
    TYPE_CHOICES = (
        ('technical', 'Technique'),
        ('financial', 'Financier'),
        ('security', 'Sécurité'),
        ('compliance', 'Conformité'),
    )

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    progress = models.IntegerField(default=0)  # Pourcentage de progression
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey('Utilisateur', on_delete=models.CASCADE, related_name='assigned_audits')
    standards = models.ManyToManyField('Standard', related_name='audits')

    def __str__(self):
        return self.title

    @property
    def is_delayed(self):
        return self.due_date < timezone.now() and self.status != 'completed'

    @property
    def days_overdue(self):
        if self.is_delayed:
            return (timezone.now() - self.due_date).days
        return 0

class AuditImage(models.Model):
    standard = models.ForeignKey(
        Standard,
        on_delete=models.CASCADE,
        related_name='images',
        null=True,
        blank=True
    )
    image = models.ImageField(upload_to='audit_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image pour {self.standard} créée le {self.created_at}"

class AuditRepere(models.Model):
    """Modèle pour les repères à vérifier lors d'un audit"""
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name='reperes')
    numero = models.IntegerField()
    nom = models.CharField(max_length=200)
    valeur_theorique = models.FloatField()
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"Repère {self.numero} - {self.nom} - Audit {self.audit.title}"
    
    class Meta:
        ordering = ['numero']

class ControlRepere(models.Model):
    """Modèle pour les contrôles effectués sur les repères"""
    STATUT_CHOICES = (
        ('conforme', 'Conforme'),
        ('non_conforme', 'Non Conforme'),
        ('na', 'Non Applicable'),
    )
    
    repere = models.ForeignKey(AuditRepere, on_delete=models.CASCADE, related_name='controles')
    date_controle = models.DateTimeField(auto_now_add=True)
    valeur_reelle = models.FloatField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)
    commentaire = models.TextField(blank=True)
    image = models.ImageField(upload_to='controle_images/', null=True, blank=True)
    
    def __str__(self):
        return f"Contrôle du repère {self.repere.numero} - {self.get_statut_display()}"
