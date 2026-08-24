from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Self-registration for members. New self-registered users always get
    the MEMBER role - elevated roles (Parish Admin etc.) are assigned by an
    existing admin, never chosen by the user at signup."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "password", "first_name", "last_name",
            "phone_number", "preferred_language", "parish",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data, role=User.Role.MEMBER)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "role",
            "phone_number", "preferred_language", "diocese", "parish", "group",
        ]
        read_only_fields = ["role", "diocese"]


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
