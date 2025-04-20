from django.core.management.base import BaseCommand
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.db import transaction

class Command(BaseCommand):
    help = 'Configure les applications sociales pour l\'authentification'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # Nettoyer tous les sites sauf example.com
            Site.objects.exclude(domain='example.com').delete()
            
            # Obtenir ou créer le site par défaut
            site, _ = Site.objects.get_or_create(
                id=1,
                defaults={
                    'domain': 'localhost:8000',
                    'name': 'localhost'
                }
            )
            site.domain = 'localhost:8000'
            site.name = 'localhost'
            site.save()

            # Supprimer TOUTES les applications sociales
            count = SocialApp.objects.all().delete()[0]
            self.stdout.write(f'{count} applications sociales supprimées.')

            # Configuration de l'application Google
            try:
                google_client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
                google_secret = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret']
            except (KeyError, AttributeError) as e:
                self.stdout.write(self.style.ERROR(
                    'Erreur: Vérifiez vos paramètres SOCIALACCOUNT_PROVIDERS dans settings.py'
                ))
                return

            # Créer une nouvelle application Google
            google_app = SocialApp(
                provider='google',
                name='Google OAuth',
                client_id=google_client_id,
                secret=google_secret
            )
            google_app.save()

            # Dissocier tous les sites existants
            google_app.sites.clear()
            # Associer uniquement le site par défaut
            google_app.sites.add(site)

            # Vérifications finales
            if SocialApp.objects.count() != 1:
                self.stdout.write(self.style.ERROR(
                    'Erreur: Le nombre d\'applications sociales n\'est pas égal à 1'
                ))
                transaction.set_rollback(True)
                return

            if not google_app.sites.filter(id=site.id).exists():
                self.stdout.write(self.style.ERROR(
                    'Erreur: L\'application Google n\'est pas correctement associée au site'
                ))
                transaction.set_rollback(True)
                return

            self.stdout.write(self.style.SUCCESS('Configuration de l\'application Google terminée avec succès!'))

        self.stdout.write(self.style.SUCCESS('Configuration des applications sociales terminée avec succès!')) 