from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        return settings.LOGIN_REDIRECT_URL

    def get_logout_redirect_url(self, request):
        return settings.ACCOUNT_LOGOUT_REDIRECT_URL


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, **kwargs):
        # Récupérer l'application sociale en utilisant le client_id s'il est fourni
        client_id = kwargs.get('client_id')
        if client_id:
            return SocialApp.objects.get(provider=provider, client_id=client_id)
        
        # Sinon, récupérer la première application pour ce provider
        return SocialApp.objects.filter(provider=provider).first()

    def get_login_redirect_url(self, request):
        return settings.LOGIN_REDIRECT_URL

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        user.role = 'operateur'  # Définir le rôle par défaut
        user.save()
        return user 