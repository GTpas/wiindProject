from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail

from WIND.models import Utilisateur, Audit, Standard
from WIND.serializers.user_serializers import UserDetailsSerializer
from WIND.serializers.audit_serializers import AuditSerializer
from WIND.services.audit_service import AuditService
from WIND.services.email_service import EmailService

class AdminDashboardView(APIView):
    """
    Vue du tableau de bord pour les administrateurs.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Vérifier que l'utilisateur est un administrateur
        if request.user.role != 'admin':
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer les statistiques globales
        now = timezone.now()
        total_audits = Audit.objects.count()
        pending_audits = Audit.objects.filter(status='pending').count()
        in_progress_audits = Audit.objects.filter(status='in_progress').count()
        completed_audits = Audit.objects.filter(status='completed').count()
        delayed_audits = Audit.objects.filter(
            due_date__lt=now, 
            status__in=['pending', 'in_progress']
        ).count()
        
        # Récupérer les opérateurs avec leurs statistiques d'audit
        operators = Utilisateur.objects.filter(role='operateur').annotate(
            audit_count=Count('assigned_audits'),
            pending_audits=Count('assigned_audits', filter=Q(assigned_audits__status='pending')),
            in_progress_audits=Count('assigned_audits', filter=Q(assigned_audits__status='in_progress')),
            completed_audits=Count('assigned_audits', filter=Q(assigned_audits__status='completed')),
            delayed_audits=Count(
                'assigned_audits', 
                filter=Q(
                    assigned_audits__due_date__lt=now,
                    assigned_audits__status__in=['pending', 'in_progress']
                )
            )
        )
        
        # Récupérer les audits récents
        recent_audits = Audit.objects.all().order_by('-created_at')[:10]
        
        # Récupérer les audits en retard
        delayed_audits_list = Audit.objects.filter(
            due_date__lt=now,
            status__in=['pending', 'in_progress']
        ).order_by('due_date')[:10]
        
        # Construire la réponse
        response_data = {
            'global_stats': {
                'total_audits': total_audits,
                'pending_audits': pending_audits,
                'in_progress_audits': in_progress_audits,
                'completed_audits': completed_audits,
                'delayed_audits': delayed_audits,
            },
            'operators': [
                {
                    'user': UserDetailsSerializer(op).data,
                    'stats': {
                        'audit_count': op.audit_count,
                        'pending_audits': op.pending_audits,
                        'in_progress_audits': op.in_progress_audits,
                        'completed_audits': op.completed_audits,
                        'delayed_audits': op.delayed_audits,
                    }
                } for op in operators
            ],
            'recent_audits': AuditSerializer(recent_audits, many=True).data,
            'delayed_audits': AuditSerializer(delayed_audits_list, many=True).data,
        }
        
        return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operator_list(request):
    """
    Récupère la liste des opérateurs pour l'administrateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    # Récupérer tous les opérateurs
    operators = Utilisateur.objects.filter(role='operateur')
    serializer = UserDetailsSerializer(operators, many=True)
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operator_audits(request, operator_id):
    """
    Récupère les audits d'un opérateur spécifique pour l'administrateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Récupérer les audits de l'opérateur
    audits = Audit.objects.filter(assigned_to=operator).order_by('-created_at')
    serializer = AuditSerializer(audits, many=True)
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_audit_to_operator(request):
    """
    Assigne un audit existant ou en crée un nouveau pour un opérateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    operator_id = request.data.get('operator_id')
    audit_id = request.data.get('audit_id')
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Si un audit_id est fourni, assigner un audit existant
    if audit_id:
        try:
            audit = Audit.objects.get(id=audit_id)
            audit.assigned_to = operator
            audit.save()
            return Response(AuditSerializer(audit).data)
        except Audit.DoesNotExist:
            return Response({'error': 'Audit non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Sinon, créer un nouvel audit
    title = request.data.get('title')
    standard_id = request.data.get('standard_id')
    due_date = request.data.get('due_date')
    description = request.data.get('description', '')
    
    if not title or not standard_id or not due_date:
        return Response(
            {'error': 'Le titre, le standard et la date d\'échéance sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        standard = Standard.objects.get(id=standard_id)
    except Standard.DoesNotExist:
        return Response({'error': 'Standard non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Créer l'audit
    audit = Audit.objects.create(
        title=title,
        type="compliance",
        assigned_to=operator,
        due_date=due_date,
        status='pending',
        description=description,
        progress=0
    )
    audit.standards.add(standard)
    
    # Générer des repères pour cet audit
    AuditService.generate_reperes_for_audit(audit)
    
    return Response(AuditSerializer(audit).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_audits_for_operator(request):
    """
    Génère un nombre spécifié d'audits pour un opérateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    operator_id = request.data.get('operator_id')
    nb_audits = request.data.get('nb_audits', 5)
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Générer des audits pour l'opérateur
    audits = AuditService.get_or_create_audits_for_operator(operator, nb_audits)
    serializer = AuditSerializer(audits, many=True)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unassigned_audits(request):
    """
    Récupère la liste des audits non assignés.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    # Récupérer les audits non assignés
    unassigned_audits = Audit.objects.filter(assigned_to__isnull=True)
    serializer = AuditSerializer(unassigned_audits, many=True)
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_operators(request):
    """
    Récupère la liste des opérateurs en attente d'approbation.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    # Récupérer tous les opérateurs qui ont vérifié leur email mais pas encore approuvés
    pending_operators = Utilisateur.objects.filter(
        role='operateur',
        email_verified=True,
        admin_approved=False
    )
    
    serializer = UserDetailsSerializer(pending_operators, many=True, context={'request': request})
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_operator(request, operator_id):
    """
    Approuve un compte opérateur et envoie le code d'activation.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        if not operator.email_verified:
            return Response(
                {'error': 'L\'opérateur n\'a pas encore vérifié son email.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marquer comme approuvé
        operator.admin_approved = True
        operator.save()
        
        # Envoyer le code d'activation
        EmailService.send_approval_code(operator)
        
        return Response({
            'message': f'Le compte de {operator.first_name} {operator.last_name} a été approuvé. Un code d\'activation a été envoyé.',
            'operator': UserDetailsSerializer(operator, context={'request': request}).data
        })
        
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_operator(request, operator_id):
    """
    Rejette un compte opérateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    reason = request.data.get('reason', 'Aucune raison spécifiée')
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        # Envoyer un email de rejet
        subject = 'WIIND 2025 - Demande d\'inscription refusée'
        message = f"""
        Bonjour {operator.first_name},
        
        Nous regrettons de vous informer que votre demande d'inscription à la plateforme WIIND 2025 a été refusée.
        
        Raison: {reason}
        
        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.
        
        L'équipe WIIND 2025
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [operator.email],
            fail_silently=False,
        )
        
        # Supprimer le compte
        operator.delete()
        
        return Response({
            'message': f'Le compte de {operator.first_name} {operator.last_name} a été rejeté et supprimé.'
        })
        
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_approval_code(request, operator_id):
    """
    Renvoie le code d'approbation à un opérateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        if not operator.admin_approved:
            return Response(
                {'error': 'Ce compte n\'a pas encore été approuvé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Générer un nouveau code et l'envoyer
        operator.approval_code = EmailService.generate_approval_code()
        operator.save()
        
        EmailService.send_approval_code(operator)
        
        return Response({
            'message': f'Un nouveau code d\'activation a été envoyé à {operator.first_name} {operator.last_name}.'
        })
        
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_operator(request, operator_id):
    """
    Désactive un compte opérateur.
    """
    # Vérifier que l'utilisateur est un administrateur
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        print(f"Tentative de désactivation de l'opérateur {operator_id}")
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        print(f"Opérateur trouvé: {operator.email}, statut actuel: is_active={operator.is_active}")
        
        # Désactiver le compte
        operator.is_active = False
        operator.save()
        
        print(f"Compte opérateur désactivé: {operator.email}")
        
        # Envoyer un email de notification
        try:
            subject = 'WIIND 2025 - Votre compte a été désactivé'
            message = f"""
            Bonjour {operator.first_name},
            
            Nous vous informons que votre compte sur la plateforme WIIND 2025 a été désactivé par un administrateur.
            
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.
            
            L'équipe WIIND 2025
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [operator.email],
                fail_silently=False,
            )
            print(f"Email de notification envoyé à {operator.email}")
        except Exception as email_error:
            print(f"Erreur lors de l'envoi de l'email: {str(email_error)}")
            # On continue même si l'envoi d'email échoue
        
        # Vérifier que le changement a été appliqué
        refreshed_operator = Utilisateur.objects.get(id=operator_id)
        print(f"Vérification après sauvegarde: is_active={refreshed_operator.is_active}")
        
        return Response({
            'message': f'Le compte de {operator.first_name} {operator.last_name} a été désactivé.',
            'operator_id': operator.id,
            'is_active': refreshed_operator.is_active
        })
        
    except Utilisateur.DoesNotExist:
        print(f"Opérateur {operator_id} non trouvé")
        return Response({'error': 'Opérateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Erreur lors de la désactivation: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operators(request):
    """
    Récupérer la liste de tous les opérateurs (actifs et inactifs)
    """
    if request.user.role != 'admin':
        return Response({"detail": "Vous n'avez pas les permissions requises."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        operators = Utilisateur.objects.filter(role='operateur')
        operator_data = []
        
        for operator in operators:
            operator_data.append({
                'id': operator.id,
                'email': operator.email,
                'first_name': operator.first_name,
                'last_name': operator.last_name,
                'date_joined': operator.date_joined,
                'is_active': operator.is_active,
                'last_login': operator.last_login
            })
        
        return Response(operator_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_operator(request, operator_id):
    """
    Réactiver un compte opérateur
    """
    print(f"DEBUG: Tentative de réactivation de l'opérateur {operator_id}")
    print(f"DEBUG: Utilisateur faisant la demande: {request.user.email}, rôle: {request.user.role}")
    
    if request.user.role != 'admin':
        print(f"DEBUG: Accès refusé - L'utilisateur n'est pas un administrateur")
        return Response({"detail": "Vous n'avez pas les permissions requises."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        print(f"DEBUG: Recherche de l'opérateur avec id={operator_id} et role='operateur'")
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        print(f"DEBUG: Opérateur trouvé: {operator.email}, statut actuel: is_active={operator.is_active}")
        
        # Vérifier si le compte est déjà actif
        if operator.is_active:
            print(f"DEBUG: Le compte est déjà actif")
            return Response({"detail": "Ce compte est déjà actif."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Réactiver le compte
        print(f"DEBUG: Réactivation du compte...")
        operator.is_active = True
        operator.save()
        
        print(f"DEBUG: Compte réactivé, statut: is_active={operator.is_active}")
        
        # Envoyer un e-mail à l'opérateur
        try:
            subject = "Votre compte a été réactivé"
            message = f"Bonjour {operator.first_name},\n\nVotre compte opérateur a été réactivé par un administrateur. Vous pouvez désormais vous connecter à la plateforme.\n\nCordialement,\nL'équipe WindTech"
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[operator.email],
                fail_silently=False,
            )
            print(f"DEBUG: Email de notification envoyé à {operator.email}")
        except Exception as email_error:
            print(f"DEBUG: Erreur lors de l'envoi de l'email: {str(email_error)}")
            # Continuer même si l'envoi d'email échoue
        
        print(f"DEBUG: Opération réussie, envoi de la réponse")
        return Response({
            "detail": f"Le compte de {operator.email} a été réactivé avec succès. Un e-mail de notification a été envoyé."
        }, status=status.HTTP_200_OK)
        
    except Utilisateur.DoesNotExist:
        print(f"DEBUG: Opérateur avec id={operator_id} et role='operateur' non trouvé")
        return Response({"detail": "Opérateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"DEBUG: Erreur inattendue: {str(e)}")
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_operator(request, operator_id):
    """
    Supprime définitivement un compte opérateur.
    """
    print(f"DEBUG: Tentative de suppression de l'opérateur {operator_id}")
    print(f"DEBUG: Utilisateur faisant la demande: {request.user.email}, rôle: {request.user.role}")
    
    if request.user.role != 'admin':
        print(f"DEBUG: Accès refusé - L'utilisateur n'est pas un administrateur")
        return Response({"detail": "Vous n'avez pas les permissions requises."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        print(f"DEBUG: Recherche de l'opérateur avec id={operator_id} et role='operateur'")
        operator = Utilisateur.objects.get(id=operator_id, role='operateur')
        
        print(f"DEBUG: Opérateur trouvé: {operator.email}")
        
        # Envoyer un email de notification avant la suppression
        try:
            subject = "Votre compte a été supprimé"
            message = f"Bonjour {operator.first_name},\n\nNous vous informons que votre compte opérateur sur la plateforme WIIND 2025 a été supprimé par un administrateur.\n\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.\n\nCordialement,\nL'équipe WindTech"
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[operator.email],
                fail_silently=False,
            )
            print(f"DEBUG: Email de notification envoyé à {operator.email}")
        except Exception as email_error:
            print(f"DEBUG: Erreur lors de l'envoi de l'email: {str(email_error)}")
            # Continuer même si l'envoi d'email échoue
        
        # Stocker temporairement le nom pour le message de confirmation
        operator_name = f"{operator.first_name} {operator.last_name}"
        operator_email = operator.email
        
        # Supprimer le compte
        print(f"DEBUG: Suppression du compte...")
        operator.delete()
        
        print(f"DEBUG: Compte supprimé avec succès")
        return Response({
            "detail": f"Le compte de {operator_name} ({operator_email}) a été supprimé définitivement."
        }, status=status.HTTP_200_OK)
        
    except Utilisateur.DoesNotExist:
        print(f"DEBUG: Opérateur avec id={operator_id} et role='operateur' non trouvé")
        return Response({"detail": "Opérateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"DEBUG: Erreur inattendue: {str(e)}")
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 