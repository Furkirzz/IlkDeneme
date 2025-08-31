from django.contrib import admin
from .models import CategoryClass, CategoryImage, CategoryText, MainPageText, Image, City, District, Address, Phone,Event,DersProgrami
from django import forms

admin.site.register(Image)
admin.site.register(MainPageText)
admin.site.register(CategoryText)
admin.site.register(CategoryImage)
admin.site.register(City)
admin.site.register(District)
admin.site.register(Address)
admin.site.register(Phone)
admin.site.register(DersProgrami)
admin.site.register(CategoryClass)










class EventAdminForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = '__all__'
        widgets = {
            'background_color': forms.TextInput(attrs={
                'type': 'color',
                'style': 'width: 100px; height: 40px;',
                'list': 'colorPresets'
            }),
            'border_color': forms.TextInput(attrs={
                'type': 'color',
                'style': 'width: 100px; height: 40px;',
                'list': 'colorPresets'
            }),
        }

class EventAdmin(admin.ModelAdmin):
    form = EventAdminForm
    list_display = ('title', 'date', 'active')
    list_filter = ('active',)
    
    class Media:
        css = {
            'all': ('admin/css/color_palette.css',)
        }
        js = ('admin/js/color_picker.js',)

admin.site.register(Event, EventAdmin)