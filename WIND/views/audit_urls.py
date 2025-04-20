from django.urls import path
from WIND.views.audit_views import audits_pour_operateur, generer_audits_view, terminer_audit, audits_pour_admin

urlpatterns = [
    path('', audits_pour_operateur, name='audits_pour_operateur'),
    path('generer_audits/', generer_audits_view, name='generer_audits'),
    path('audits/<int:audit_id>/terminer/', terminer_audit, name='terminer_audit'),
    path('admin_audits/', audits_pour_admin, name='audits_pour_admin'),
]
