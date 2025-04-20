from rest_framework import serializers
from WIND.models.models import Audit, Standard, AuditImage, AuditRepere, ControlRepere

class AuditImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditImage
        fields = ['id', 'image', 'created_at']

class StandardSerializer(serializers.ModelSerializer):
    images = AuditImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Standard
        fields = ['id', 'nom', 'description', 'status', 'comment', 'images']

class AuditSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    standards = StandardSerializer(many=True, read_only=True)
    
    class Meta:
        model = Audit
        fields = [
            'id', 'title', 'type', 'type_display', 'status', 'status_display',
            'created_at', 'due_date', 'completed_at', 'progress', 'description',
            'days_overdue', 'standards'
        ]

    def get_progress(self, obj):
        total_standards = obj.standards.count()
        if total_standards == 0:
            return 0
        
        completed_standards = obj.standards.filter(
            status__in=['OK', 'NA']
        ).count()
        
        return int((completed_standards / total_standards) * 100)

    def get_daysOverdue(self, obj):
        if obj.status != 'completed' and obj.due_date:
            from django.utils import timezone
            now = timezone.now()
            if now > obj.due_date:
                return (now.date() - obj.due_date.date()).days
        return 0

class AuditStatsSerializer(serializers.Serializer):
    total_audits = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    completed = serializers.IntegerField()
    delayed = serializers.IntegerField()
    progress_by_period = serializers.DictField()

class DelayedAuditSerializer(serializers.ModelSerializer):
    days_overdue = serializers.IntegerField(read_only=True)

    class Meta:
        model = Audit
        fields = ['id', 'title', 'due_date', 'days_overdue']

class ControlRepereSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = ControlRepere
        fields = [
            'id', 'valeur_reelle', 'statut', 'statut_display', 
            'commentaire', 'image', 'date_controle'
        ]
        
class AuditRepereSerializer(serializers.ModelSerializer):
    controle = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditRepere
        fields = ['id', 'numero', 'nom', 'valeur_theorique', 'description', 'controle']
        
    def get_controle(self, obj):
        # Récupérer le dernier contrôle du repère s'il existe
        controle = obj.controles.first()
        if controle:
            return ControlRepereSerializer(controle).data
        return None
        
class AuditDetailSerializer(serializers.ModelSerializer):
    reperes = AuditRepereSerializer(many=True, read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Audit
        fields = [
            'id', 'title', 'type', 'type_display', 'status', 'status_display',
            'created_at', 'due_date', 'completed_at', 'progress', 'description',
            'reperes'
        ]
        
class AuditProgressSerializer(serializers.Serializer):
    date = serializers.DateField()
    progress = serializers.FloatField()
    target = serializers.FloatField(default=90.0)

class AuditExecutionSerializer(serializers.Serializer):
    """Sérialiseur pour l'exécution d'un audit avec ses repères et contrôles"""
    audit = AuditSerializer(read_only=True)
    reperes = AuditRepereSerializer(many=True, read_only=True)
    total_reperes = serializers.IntegerField(read_only=True)
    controles_effectues = serializers.IntegerField(read_only=True)
    
class RepereControlSerializer(serializers.Serializer):
    """Sérialiseur pour la soumission d'un contrôle de repère"""
    valeur_reelle = serializers.FloatField(required=True)
    statut = serializers.ChoiceField(choices=ControlRepere.STATUT_CHOICES, required=True)
    commentaire = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)
