from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from WIND.services.audit_service import AuditService
from WIND.serializers.user_serializers import UserDetailsSerializer
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from django.shortcuts import redirect
from django.urls import reverse
from django.views.generic import View
from django.http import HttpResponseRedirect
from urllib.parse import urlencode
from rest_framework.renderers import JSONRenderer
from allauth.socialaccount.providers.oauth2.views import OAuth2LoginView, OAuth2CallbackView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter


class GoogleLoginView(APIView):
    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        try:
            # Récupérer l'application Google
            app = SocialApp.objects.get(provider='google')
            
            # URL de callback backend
            callback_url = request.build_absolute_uri('/api/auth/google/callback/')
            
            # Paramètres pour l'URL d'autorisation Google
            params = {
                'client_id': app.client_id,
                'redirect_uri': callback_url,
                'response_type': 'code',
                'scope': ' '.join([
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile',
                ]),
                'access_type': 'online',
                'state': request.session.session_key or '',
            }
            
            # Construire l'URL d'autorisation
            authorize_url = f'https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}'
            
            # Rediriger directement vers Google
            return HttpResponseRedirect(authorize_url)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'authentification Google: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class GoogleCallbackView(APIView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

    def get(self, request, *args, **kwargs):
        try:
            code = request.GET.get('code')
            if not code:
                return Response(
                    {'error': 'Code d\'autorisation manquant'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Récupérer l'application Google
            app = SocialApp.objects.get(provider='google')
            
            # Créer l'adaptateur avec le request
            adapter = self.adapter_class(request=request)
            
            # Obtenir le client OAuth2
            callback_url = request.build_absolute_uri('/api/auth/google/callback/')
            
            # Créer le client OAuth2 avec les bons paramètres
            client = OAuth2Client(
                request=request,
                app=app,
                adapter=adapter,
                callback_url=callback_url
            )
            
            # Échanger le code contre un token
            token = client.get_access_token(code)
            
            # Obtenir les informations de l'utilisateur
            user_data = adapter.get_user_info(token['access_token'])
            
            # Créer ou mettre à jour l'utilisateur
            user = adapter.get_or_create_user(request, token, user_data)
            
            # Si c'est un nouvel utilisateur, définir le rôle par défaut
            if hasattr(user, 'date_joined') and user.date_joined == user.last_login:
                user.role = 'operateur'
                user.save()
                if user.role == 'operateur':
                    AuditService.get_or_create_audits_for_operator(user)

            # Rediriger vers le frontend avec le token
            frontend_url = f"http://localhost:3000/auth-callback?token={token['access_token']}"
            return HttpResponseRedirect(frontend_url)

        except Exception as e:
            return Response(
                {'error': f'Erreur lors du callback Google: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            ) 