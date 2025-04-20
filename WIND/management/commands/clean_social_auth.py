from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp, SocialAccount, SocialToken
from django.db import transaction
from django.conf import settings

class Command(BaseCommand):
    help = 'Nettoie complètement la configuration d\'authentification sociale'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # 1. Supprimer toutes les données sociales
            self.stdout.write('Suppression des tokens sociaux...')
            token_count = SocialToken.objects.all().delete()[0]
            self.stdout.write(f'{token_count} tokens supprimés.')

            self.stdout.write('Suppression des comptes sociaux...')
            account_count = SocialAccount.objects.all().delete()[0]
            self.stdout.write(f'{account_count} comptes supprimés.')

            self.stdout.write('Suppression des applications sociales...')
            app_count = SocialApp.objects.all().delete()[0]
            self.stdout.write(f'{app_count} applications supprimées.')

            # 2. Supprimer tous les sites sauf le site par défaut
            self.stdout.write('Nettoyage des sites...')
            Site.objects.exclude(id=1).delete()

            # 3. Configurer le site par défaut
            site = Site.objects.get(id=1)
            site.domain = 'localhost:8000'
            site.name = 'localhost'
            site.save()
            self.stdout.write('Site par défaut configuré.')

            # 4. Créer une nouvelle application Google
            try:
                google_client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
                google_secret = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret']
            except (KeyError, AttributeError) as e:
                self.stdout.write(self.style.ERROR(
                    'Erreur: Vérifiez vos paramètres SOCIALACCOUNT_PROVIDERS dans settings.py'
                ))
                return

            google_app = SocialApp.objects.create(
                provider='google',
                name='Google OAuth',
                client_id=google_client_id,
                secret=google_secret
            )
            google_app.sites.add(site)
            self.stdout.write('Application Google créée.')

            # 5. Vérifications finales
            apps_count = SocialApp.objects.count()
            sites_count = Site.objects.count()
            google_sites_count = google_app.sites.count()

            self.stdout.write('\nÉtat final :')
            self.stdout.write(f'- Applications sociales : {apps_count} (attendu: 1)')
            self.stdout.write(f'- Sites : {sites_count} (attendu: 1)')
            self.stdout.write(f'- Sites associés à Google : {google_sites_count} (attendu: 1)')

            if apps_count != 1 or sites_count != 1 or google_sites_count != 1:
                self.stdout.write(self.style.ERROR(
                    'ATTENTION: Les nombres ne correspondent pas aux attentes!'
                ))
                return

            self.stdout.write(self.style.SUCCESS('Nettoyage et configuration terminés avec succès!')) 