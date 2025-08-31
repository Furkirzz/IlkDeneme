# backend/assistant/views.py

import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import QAEntry

# OpenAI/OpenRouter istemcisi
from openai import OpenAI

# API istemcisi başlat
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Soru-Cevapları listeleyen endpoint
class QAListAPIView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'lang',
                openapi.IN_QUERY,
                description="Dil kodu (örnek: tr veya en)",
                type=openapi.TYPE_STRING,
                default="tr"
            )
        ],
        responses={200: openapi.Response("Soru-Cevap listesi")}
    )
    def get(self, request):
        lang = request.GET.get("lang", "tr")
        entries = QAEntry.objects.filter(language=lang, active=True)
        result = [{"question": e.question, "answer": e.answer} for e in entries]
        return Response(result)

# Asistanla konuşma endpoint'i
@csrf_exempt
def ask_assistant(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            messages = data.get('messages', [])

            if not isinstance(messages, list) or not messages:
                return JsonResponse({'error': 'Geçerli bir mesaj listesi gönderilmedi.'}, status=400)

            # API çağrısı
            response = client.chat.completions.create(
                model="openrouter/auto",
                messages=messages,  # frontend'den gelen tüm geçmişi gönderiyoruz
                max_tokens=150,
                temperature=0.7
            )

            answer = response.choices[0].message.content.strip()
            return JsonResponse({'answer': answer})

        except Exception as e:
            print(f"API Hatası: {e}")
            return JsonResponse({'error': f'An API error occurred: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Invalid request method. Only POST is allowed.'}, status=405)


