from django.contrib import admin
from .models import Artist, Album, Track, DownloadLog

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'release_date']
    list_filter = ['artist']
    search_fields = ['title']

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'album', 'duration', 'created_at']
    list_filter = ['artist', 'album']
    search_fields = ['title']

@admin.register(DownloadLog)
class DownloadLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'downloaded_at']
    list_filter = ['downloaded_at']
