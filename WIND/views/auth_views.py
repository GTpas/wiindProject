from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from datetime import timedelta
from WIND.models import Utilisateur
from WIND.services.audit_service import AuditService
from WIND.services.email_service import EmailService
from WIND.serializers.user_serializers import UserSerializer, UserDetailsSerializer
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404


class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'operateur')
        
        if not email or not password:
            return Response(
                {'error': 'Email et mot de passe requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if Utilisateur.objects.filter(email=email).exists():
            return Response(
                {'error': 'Cet email est déjà utilisé'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Créer l'utilisateur (désactivé initialement pour les opérateurs)
            is_active = role == 'admin'  # Seuls les admins sont activés immédiatement
            
            user = Utilisateur.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=is_active
            )
            
            if role == 'admin':
                # Les administrateurs sont automatiquement validés
                user.email_verified = True
                user.admin_approved = True
                user.save()
                
                # Connexion automatique pour les admins
                auth_user = authenticate(request, email=email, password=password)
                if auth_user:
                    login(request, auth_user)
                
                return Response({
                    'user': UserSerializer(user).data,
                    'redirect_url': '/admin-dashboard'
                }, status=status.HTTP_201_CREATED)
            else:
                # Pour les opérateurs, envoyer un email de vérification
                EmailService.send_verification_email(user)
                
                return Response({
                    'message': 'Votre compte a été créé. Veuillez vérifier votre email pour activer votre compte.',
                    'redirect_url': '/verification-pending'
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email et mot de passe requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            # Vérifier si l'utilisateur a complété toutes les étapes de vérification
            if user.role == 'operateur' and not user.is_active:
                if not user.email_verified:
                    return Response({
                        'error': 'Votre email n\'a pas été vérifié. Veuillez vérifier votre boîte de réception.',
                        'status': 'email_not_verified',
                        'email': user.email
                    }, status=status.HTTP_403_FORBIDDEN)
                elif not user.admin_approved:
                    return Response({
                        'error': 'Votre compte est en attente d\'approbation par un administrateur.',
                        'status': 'waiting_admin_approval',
                        'email': user.email
                    }, status=status.HTTP_403_FORBIDDEN)
                elif user.admin_approved and user.approval_code:
                    return Response({
                        'error': 'Votre compte nécessite un code d\'activation.',
                        'status': 'approval_code_required',
                        'email': user.email
                    }, status=status.HTTP_403_FORBIDDEN)
            
            login(request, user)
            return Response({
                'user': UserSerializer(user).data,
                'redirect_url': '/auditCanva' if user.role == 'operateur' else '/admin-dashboard'
            })
        else:
            return Response(
                {'error': 'Identifiants invalides'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileView(APIView):
    """
    Vue pour récupérer et mettre à jour le profil utilisateur.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Récupérer les informations détaillées de l'utilisateur connecté.
        """
        serializer = UserDetailsSerializer(request.user, context={'request': request})
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_avatar(request):
    """
    Mettre à jour l'avatar de l'utilisateur.
    """
    user = request.user
    
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'Aucun fichier d\'avatar fourni'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Supprimer l'ancien avatar s'il existe
        if user.avatar:
            user.avatar.delete(save=False)
        
        # Mettre à jour avec le nouvel avatar
        user.avatar = request.FILES['avatar']
        user.save()
        
        # Passer la requête au sérialiseur pour construire l'URL complète
        serializer = UserDetailsSerializer(user, context={'request': request})
        
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """
    Vérifie l'email d'un utilisateur à partir du token envoyé par email.
    """
    try:
        user = Utilisateur.objects.get(email_verification_token=token)
        
        # Vérifier si le token n'a pas expiré (24h)
        if user.email_verification_sent_at and timezone.now() > user.email_verification_sent_at + timedelta(hours=24):
            return Response({
                'error': 'Le lien de vérification a expiré. Veuillez demander un nouveau lien.',
                'status': 'token_expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marquer l'email comme vérifié
        user.email_verified = True
        user.save()
        
        return Response({
            'message': 'Votre email a été vérifié avec succès. Votre compte est maintenant en attente d\'approbation par un administrateur.',
            'status': 'email_verified'
        }, status=status.HTTP_200_OK)
        
    except Utilisateur.DoesNotExist:
        return Response({
            'error': 'Token de vérification invalide.',
            'status': 'invalid_token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_approval_code(request):
    """
    Vérifie le code d'approbation envoyé par l'administrateur.
    """
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email et code sont requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = Utilisateur.objects.get(email=email)
        
        # Vérifier si le code correspond
        if user.approval_code != code:
            return Response({'error': 'Code invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur est approuvé
        if not user.admin_approved:
            return Response({'error': 'Votre compte n\'a pas encore été approuvé'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Activer le compte s'il n'est pas déjà actif
        if not user.is_active:
            user.is_active = True
            user.save()
        
        # Créer et renvoyer un token JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'redirect_url': '/auditCanva' if user.role == 'operateur' else '/admin-dashboard'
        })
        
    except Utilisateur.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """
    Renvoie l'email de vérification à l'utilisateur.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email requis',
            'status': 'missing_email'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Utilisateur.objects.get(email=email)
        
        if user.email_verified:
            return Response({
                'error': 'Votre email a déjà été vérifié.',
                'status': 'already_verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Générer un nouveau token et envoyer l'email
        user.email_verification_token = EmailService.generate_verification_token()
        EmailService.send_verification_email(user)
        
        return Response({
            'message': 'Un nouvel email de vérification a été envoyé.',
            'status': 'email_sent'
        }, status=status.HTTP_200_OK)
        
    except Utilisateur.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé.',
            'status': 'user_not_found'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

