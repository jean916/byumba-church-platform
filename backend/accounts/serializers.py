from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


def _email_in_use(email, exclude_pk=None):
    qs = User.objects.filter(email__iexact=email)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    return qs.exists()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Self-registration for members. New self-registered users always get
    the MEMBER role - elevated roles (Parish Admin etc.) are assigned by an
    existing admin, never chosen by the user at signup.

    Email is required and must be unique: it is how a forgotten password is
    recovered, so two accounts sharing one address would reset each other."""

    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "password", "first_name", "last_name",
            "phone_number", "preferred_language", "parish",
        ]
        extra_kwargs = {"parish": {"required": True, "allow_null": False}}

    def validate_email(self, value):
        if _email_in_use(value):
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)  # Django's common/numeric-password checks
        return value

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

    def validate_email(self, value):
        if value and _email_in_use(value, exclude_pk=getattr(self.instance, "pk", None)):
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        inst = self.instance
        if inst is None:
            return attrs
        # Admins and leaders get their powers from their parish/group, so they
        # must not be able to re-point themselves at another one via /me/.
        if inst.role != User.Role.MEMBER:
            for field in ("parish", "group"):
                if field in attrs and attrs[field] != getattr(inst, field):
                    raise serializers.ValidationError(
                        {field: "Ask a diocese administrator to change this."}
                    )
        # A member's group must sit inside their own parish.
        parish = attrs.get("parish", inst.parish)
        group = attrs.get("group")
        if group is not None:
            if parish is None or group.parish_id != parish.id:
                raise serializers.ValidationError({"group": "This group is not in your parish."})
        elif "group" not in attrs and inst.group is not None and (parish is None or inst.group.parish_id != parish.id):
            # Moving to another parish: leave the old parish's group.
            attrs["group"] = None
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value
