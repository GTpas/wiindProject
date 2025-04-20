from django.urls import path
from WIND.views.audit_views import (
    AuditProgressView,
    AuditImageUploadView,
    DashboardView,
    audits_pour_operateur,
    generer_audits_view,
    terminer_audit,
    audits_pour_admin,
    get_operator_audits,
    update_audit_status,
    AuditExecutionView,
    RepereControlView,
    regenerate_audit_reperes
)
from WIND.views.auth_views import (
    SignInView, 
    SignUpView, 
    UserProfileView, 
    update_user_avatar,
    verify_email,
    verify_approval_code,
    resend_verification_email
)
from WIND.views.admin_views import (
    AdminDashboardView,
    get_operator_list,
    get_operator_audits as admin_get_operator_audits,
    assign_audit_to_operator,
    generate_audits_for_operator,
    get_unassigned_audits,
    get_pending_operators,
    approve_operator,
    reject_operator,
    resend_approval_code,
    disable_operator,
    enable_operator,
    get_operators,
    delete_operator
)

urlpatterns = [
    # Authentication URLs
    path('api/auth/signin/', SignInView.as_view(), name='signin'),
    path('api/auth/signup/', SignUpView.as_view(), name='signup'),
    path('api/auth/user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/auth/update-avatar/', update_user_avatar, name='update-avatar'),
    
    # Nouvelles URLs pour la validation en deux étapes
    path('api/auth/verify-email/<str:token>/', verify_email, name='verify-email'),
    path('api/auth/verify-code/', verify_approval_code, name='verify-approval-code'),
    path('api/auth/resend-verification/', resend_verification_email, name='resend-verification'),
    
    # Audit URLs
    path('api/audits/dashboard/', DashboardView.as_view(), name='audit-dashboard'),
    path('api/audits/progress/', AuditProgressView.as_view(), name='audit-progress'),
    path('api/audits/<int:audit_id>/upload-image/', AuditImageUploadView.as_view(), name='audit-image-upload'),
    
    # Operator Audit URLs
    path('api/operator-audits/', get_operator_audits, name='operator-audits'),
    path('api/audits/<int:audit_id>/status/', update_audit_status, name='update-audit-status'),
    path('api/audits/generate/', generer_audits_view, name='generate-audits'),
    path('api/audits/<int:audit_id>/complete/', terminer_audit, name='complete-audit'),
    path('api/audits/admin/', audits_pour_admin, name='admin-audits'),
    path('api/audits/operator/', audits_pour_operateur, name='operator-specific-audits'),
    
    # Audit Execution URLs
    path('api/audits/<int:audit_id>/execution/', AuditExecutionView.as_view(), name='audit-execution'),
    path('api/reperes/<int:repere_id>/control/', RepereControlView.as_view(), name='repere-control'),
    
    # New URL for regenerating reperes
    path('api/audits/<int:audit_id>/regenerate-reperes/', regenerate_audit_reperes, name='regenerate-audit-reperes'),
    
    # Admin Dashboard URLs
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/operators/', get_operators, name='admin-get-operators'),
    path('api/admin/operators/<int:operator_id>/audits/', admin_get_operator_audits, name='admin-operator-audits'),
    path('api/admin/assign-audit/', assign_audit_to_operator, name='admin-assign-audit'),
    path('api/admin/generate-audits/', generate_audits_for_operator, name='admin-generate-audits'),
    path('api/admin/unassigned-audits/', get_unassigned_audits, name='admin-unassigned-audits'),
    
    # Nouvelles URLs pour l'approbation des opérateurs
    path('api/admin/pending-operators/', get_pending_operators, name='admin-pending-operators'),
    path('api/admin/operators/<int:operator_id>/approve/', approve_operator, name='admin-approve-operator'),
    path('api/admin/operators/<int:operator_id>/reject/', reject_operator, name='admin-reject-operator'),
    path('api/admin/operators/<int:operator_id>/resend-code/', resend_approval_code, name='admin-resend-code'),
    path('api/admin/operators/<int:operator_id>/disable/', disable_operator, name='admin-disable-operator'),
    path('api/admin/operators/<int:operator_id>/enable/', enable_operator, name='admin-enable-operator'),
    path('api/admin/operators/<int:operator_id>/delete/', delete_operator, name='admin-delete-operator'),
] 