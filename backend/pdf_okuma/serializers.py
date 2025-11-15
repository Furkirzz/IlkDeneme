from rest_framework import serializers
from .models import ExamResult, ExamSet


class ExamSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSet
        fields = "__all__"


class ExamResultSerializer(serializers.ModelSerializer):
    exam_set_name = serializers.CharField(source="exam_set.name", read_only=True)

    class Meta:
        model = ExamResult
        fields = "__all__"
