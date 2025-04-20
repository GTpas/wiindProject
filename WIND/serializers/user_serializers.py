from rest_framework import serializers
from WIND.models import Utilisateur
from django.contrib.auth.password_validation import validate_password


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Utilisateur
        fields = ['email', 'password', 'password_confirm', 'role', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = Utilisateur.objects.create(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'operateur')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserDetailsSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'avatar_url']
        read_only_fields = ['id']
    
    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id'] 