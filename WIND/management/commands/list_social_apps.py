from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

class Command(BaseCommand):
    help = 'Liste toutes les applications sociales enregistrées'

    def handle(self, *args, **kwargs):
        self.stdout.write('Sites configurés :')
        self.stdout.write('-' * 50)
        for site in Site.objects.all():
            self.stdout.write(f'Site ID: {site.id}')
            self.stdout.write(f'Domain: {site.domain}')
            self.stdout.write(f'Name: {site.name}')
            self.stdout.write('-' * 50)

        self.stdout.write('\nApplications sociales enregistrées :')
        self.stdout.write('-' * 50)
        
        apps = SocialApp.objects.all().prefetch_related('sites')
        if not apps.exists():
            self.stdout.write('Aucune application sociale trouvée.')
            return

        for app in apps:
            self.stdout.write(f'ID: {app.id}')
            self.stdout.write(f'Provider: {app.provider}')
            self.stdout.write(f'Name: {app.name}')
            self.stdout.write(f'Client ID: {app.client_id}')
            self.stdout.write('Sites associés:')
            for site in app.sites.all():
                self.stdout.write(f'  - {site.domain} (ID: {site.id})')
            self.stdout.write('-' * 50) 