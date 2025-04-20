from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.db import connection

class Command(BaseCommand):
    help = 'Diagnostique la configuration d\'authentification sociale'

    def handle(self, *args, **kwargs):
        # 1. Vérifier les tables directement avec SQL
        self.stdout.write('\n=== Vérification directe des tables ===')
        
        with connection.cursor() as cursor:
            # Vérifier socialaccount_socialapp
            cursor.execute("""
                SELECT id, provider, name, client_id, secret 
                FROM socialaccount_socialapp
            """)
            self.stdout.write('\nApplications sociales (table brute) :')
            self.stdout.write('-' * 50)
            for row in cursor.fetchall():
                self.stdout.write(f'ID: {row[0]}')
                self.stdout.write(f'Provider: {row[1]}')
                self.stdout.write(f'Name: {row[2]}')
                self.stdout.write(f'Client ID: {row[3]}')
                self.stdout.write('-' * 50)

            # Vérifier socialaccount_socialapp_sites
            cursor.execute("""
                SELECT socialapp_id, site_id 
                FROM socialaccount_socialapp_sites
            """)
            self.stdout.write('\nAssociations App-Sites (table brute) :')
            self.stdout.write('-' * 50)
            for row in cursor.fetchall():
                self.stdout.write(f'App ID: {row[0]} -> Site ID: {row[1]}')
            self.stdout.write('-' * 50)

            # Vérifier django_site
            cursor.execute("""
                SELECT id, domain, name 
                FROM django_site
            """)
            self.stdout.write('\nSites (table brute) :')
            self.stdout.write('-' * 50)
            for row in cursor.fetchall():
                self.stdout.write(f'ID: {row[0]}')
                self.stdout.write(f'Domain: {row[1]}')
                self.stdout.write(f'Name: {row[2]}')
                self.stdout.write('-' * 50)

        # 2. Vérifier avec l'ORM
        self.stdout.write('\n=== Vérification via ORM ===')
        
        # Compter les applications par provider
        providers = SocialApp.objects.values('provider').distinct()
        self.stdout.write('\nProviders uniques :')
        for provider in providers:
            count = SocialApp.objects.filter(provider=provider['provider']).count()
            self.stdout.write(f"- {provider['provider']}: {count} application(s)")

        # Vérifier les applications Google
        google_apps = SocialApp.objects.filter(provider='google')
        self.stdout.write('\nDétails des applications Google :')
        for app in google_apps:
            self.stdout.write(f'\nApplication ID: {app.id}')
            self.stdout.write(f'Nom: {app.name}')
            self.stdout.write(f'Client ID: {app.client_id}')
            self.stdout.write('Sites associés:')
            for site in app.sites.all():
                self.stdout.write(f'- {site.domain} (ID: {site.id})') 