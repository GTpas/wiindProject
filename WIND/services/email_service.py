import uuid
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.utils import timezone


class EmailService:
    """Service pour l'envoi d'emails dans l'application"""
    
    @staticmethod
    def generate_verification_token():
        """Génère un token unique pour la vérification d'email"""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_approval_code(length=6):
        """Génère un code numérique pour l'approbation par l'administrateur"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def send_verification_email(user):
        """Envoie un email de vérification à l'utilisateur"""
        if not user.email_verification_token:
            user.email_verification_token = EmailService.generate_verification_token()
            
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Construction du lien de vérification
        verification_url = f"{settings.SITE_URL}/verify-email/{user.email_verification_token}"
        
        # Envoi de l'email
        subject = 'WIIND 2025 - Vérification de votre adresse email'
        message = f"""
        Bonjour {user.first_name},
        
        Merci de vous être inscrit sur la plateforme WIIND 2025. 
        Pour vérifier votre adresse email, veuillez cliquer sur le lien suivant:
        
        {verification_url}
        
        Ce lien est valide pendant 24 heures.
        
        Une fois votre email vérifié, un administrateur examinera votre demande d'inscription.
        Vous recevrez un code d'activation si votre demande est approuvée.
        
        L'équipe WIIND 2025
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return True
    
    @staticmethod
    def send_approval_code(user):
        """Envoie un code d'approbation à l'utilisateur après validation par l'admin"""
        if not user.approval_code:
            user.approval_code = EmailService.generate_approval_code()
            
        user.approval_code_sent_at = timezone.now()
        user.save()
        
        # Envoi de l'email avec le code
        subject = 'WIIND 2025 - Votre compte a été approuvé'
        message = f"""
        Bonjour {user.first_name},
        
        Nous avons le plaisir de vous informer que votre compte sur la plateforme WIIND 2025 a été approuvé par un administrateur.
        
        Pour terminer l'activation de votre compte, veuillez vous connecter et saisir le code suivant lorsqu'il vous sera demandé:
        
        {user.approval_code}
        
        Ce code est valide pendant 48 heures.
        
        L'équipe WIIND 2025
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return True
    
    @staticmethod
    def send_account_activated_email(user):
        """Envoie un email confirmant l'activation complète du compte"""
        subject = 'WIIND 2025 - Votre compte est maintenant activé'
        message = f"""
        Bonjour {user.first_name},
        
        Félicitations! Votre compte sur la plateforme WIIND 2025 est maintenant complètement activé.
        
        Vous pouvez vous connecter et accéder à toutes les fonctionnalités de la plateforme.
        
        L'équipe WIIND 2025
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return True 