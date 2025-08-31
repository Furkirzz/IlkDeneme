from django.contrib import admin
from .models import QAEntry
from django.db.models import Q

@admin.register(QAEntry)
class QAEntryAdmin(admin.ModelAdmin):
    list_display = ["get_language", "question", "active"]
    search_fields = ["question", "answer"]
    list_filter = ["language", "active"]

    def get_language(self, obj):
        return dict(obj._meta.get_field("language").choices).get(obj.language)
    get_language.short_description = "Dil"
    
    def get_search_results(self, request, queryset, search_term):
        # Büyük/küçük harf duyarsız arama uygula
        queryset = self.model.objects.filter(
            Q(question__icontains=search_term) |
            Q(answer__icontains=search_term)
        )
        return queryset, False