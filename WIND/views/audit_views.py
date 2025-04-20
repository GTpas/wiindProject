from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from WIND.models.models import Audit, AuditRepere, ControlRepere
from WIND.services.services import generer_audits
from WIND.serializers.audit_serializers import AuditSerializer, AuditDetailSerializer, AuditProgressSerializer
from rest_framework import status
from WIND.services.audit_service import AuditService
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import timedelta
from WIND.models import Standard, AuditImage
from WIND.serializers.audit_serializers import StandardSerializer
import os
from django.conf import settings
from django.db.models import Count, Q, Avg
from WIND.serializers.audit_serializers import (
    AuditStatsSerializer,
    DelayedAuditSerializer,
    RepereControlSerializer,
    ControlRepereSerializer,
    AuditExecutionSerializer
)
from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audits_pour_operateur(request):
    user_email = request.GET.get('user_email')
    if user_email:
        audits = Audit.objects.filter(operateur__email=user_email)
        serializer = AuditSerializer(audits, many=True)
        return Response(serializer.data)
    return Response({"error": "Email utilisateur non fourni"}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generer_audits_view(request):
    """Génère les audits"""
    resultat = generer_audits()
    return Response({"message": resultat})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminer_audit(request, audit_id):
    try:
        audit = Audit.objects.get(id=audit_id, operateur=request.user)
        audit.status = "TERMINE"
        audit.save()
        return Response({"message": "Audit terminé avec succès"})
    except Audit.DoesNotExist:
        return Response({"error": "Audit non trouvé"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audits_pour_admin(request):
    audits = Audit.objects.all()
    serializer = AuditSerializer(audits, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operator_audits(request):
    """Récupère les audits assignés à l'opérateur connecté"""
    audits = Audit.objects.filter(assigned_to=request.user).order_by('-created_at')
    serializer = AuditSerializer(audits, many=True)
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_audit_status(request, audit_id):
    """Met à jour le statut d'un audit"""
    audit = get_object_or_404(Audit, id=audit_id, assigned_to=request.user)
    new_status = request.data.get('status')
    
    if new_status not in dict(Audit.STATUS_CHOICES):
        return Response(
            {"error": "Statut invalide"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    audit.status = new_status
    if new_status == 'completed':
        audit.completed_at = timezone.now()
    audit.save()
    
    serializer = AuditSerializer(audit)
    return Response(serializer.data)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        # Statistiques globales
        total_audits = Audit.objects.filter(assigned_to=user).count()
        in_progress = Audit.objects.filter(assigned_to=user, status='in_progress').count()
        completed = Audit.objects.filter(assigned_to=user, status='completed').count()
        delayed = Audit.objects.filter(
            assigned_to=user,
            due_date__lt=now,
            status__in=['pending', 'in_progress']
        ).count()

        # Audits en retard
        delayed_audits = Audit.objects.filter(
            assigned_to=user,
            due_date__lt=now,
            status__in=['pending', 'in_progress']
        ).order_by('due_date')[:5]

        # Audits récents
        recent_audits = Audit.objects.filter(
            assigned_to=user
        ).order_by('-created_at')[:5]

        response_data = {
            'stats': {
                'total_audits': total_audits,
                'in_progress': in_progress,
                'completed': completed,
                'delayed': delayed,
            },
            'delayed_audits': DelayedAuditSerializer(delayed_audits, many=True).data,
            'recent_audits': AuditSerializer(recent_audits, many=True).data,
        }

        return Response(response_data)

class AuditProgressView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'month')
        
        now = timezone.now()
        
        # Filtrer les audits de l'utilisateur
        user_audits = Audit.objects.filter(assigned_to=user)
        
        # Définir la plage de dates en fonction de la période
        if period == 'week':
            start_date = now - timedelta(days=7)
            date_format = '%d/%m'
        elif period == 'month':
            start_date = now - timedelta(days=30)
            date_format = '%d/%m'
        else:  # year
            start_date = now - timedelta(days=365)
            date_format = '%m/%Y'
        
        # Créer une structure de données pour chaque jour de la période
        progress_data = []
        current_date = start_date
        while current_date <= now:
            # Récupérer les audits terminés avant cette date
            completed_audits = user_audits.filter(
                completed_at__lte=current_date
            ).count()
            
            # Récupérer le total des audits prévus avant cette date
            total_audits = user_audits.filter(
                created_at__lte=current_date
            ).count()
            
            # Calculer le pourcentage d'avancement
            progress = 0
            if total_audits > 0:
                progress = (completed_audits / total_audits) * 100
            
            # Ajouter à la liste
            progress_data.append({
                'date': current_date.strftime(date_format),
                'progress': round(progress, 2),
                'target': 90.0  # Valeur cible (peut être configurée)
            })
            
            # Incrémenter la date selon la période
            if period == 'week':
                current_date += timedelta(days=1)
            elif period == 'month':
                current_date += timedelta(days=1)
            else:  # year
                current_date += timedelta(days=30)
        
        serializer = AuditProgressSerializer(progress_data, many=True)
        return Response(serializer.data)

class AuditImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, audit_id):
        audit = get_object_or_404(Audit, id=audit_id, assigned_to=request.user)
        
        # Vérifier si une image est fournie
        if 'image' not in request.FILES:
            return Response(
                {"error": "Image requise"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer le standard associé
        standard_id = request.data.get('standard_id')
        if not standard_id:
            return Response(
                {"error": "ID du standard requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        standard = get_object_or_404(Standard, id=standard_id)
        
        # Créer une nouvelle image d'audit
        audit_image = AuditImage.objects.create(
            standard=standard,
            image=request.FILES['image']
        )
        
        return Response(
            {"message": "Image téléchargée avec succès", "image_id": audit_image.id},
            status=status.HTTP_201_CREATED
        )

class AuditExecutionView(APIView):
    """Vue pour l'exécution d'un audit"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, audit_id):
        """Récupère les détails d'un audit avec ses repères pour exécution"""
        audit_details = AuditService.get_audit_details(audit_id, request.user)
        
        if not audit_details:
            return Response(
                {"error": "Audit non trouvé"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        return Response(audit_details)
    
    def post(self, request, audit_id):
        """Marquer un audit comme terminé"""
        success, message = AuditService.complete_audit(audit_id, request.user)
        
        if not success:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response({"message": message})

class RepereControlView(APIView):
    """Vue pour le contrôle d'un repère"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, repere_id):
        """Soumettre un contrôle pour un repère"""
        serializer = RepereControlSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Traiter l'image si elle est fournie
        if 'image' in request.FILES:
            serializer.validated_data['image'] = request.FILES['image']
        
        # Sauvegarder le contrôle
        controle = AuditService.save_repere_control(
            repere_id, 
            request.user, 
            serializer.validated_data
        )
        
        if not controle:
            return Response(
                {"error": "Repère non trouvé ou non autorisé"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Retourner le contrôle créé
        return Response(
            ControlRepereSerializer(controle).data,
            status=status.HTTP_201_CREATED
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_audit_reperes(request, audit_id):
    """
    Régénère les repères pour un audit existant.
    """
    # Vérifier que l'utilisateur a accès à cet audit
    audit = get_object_or_404(Audit, id=audit_id, assigned_to=request.user)
    
    # Régénérer les repères
    AuditService.generate_reperes_for_audit(audit, nb_reperes=10)
    
    # Récupérer les détails de l'audit mis à jour
    audit_details = AuditService.get_audit_details(audit_id, request.user)
    
    return Response(audit_details, status=status.HTTP_200_OK)
