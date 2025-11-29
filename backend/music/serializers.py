from rest_framework import serializers
from .models import Artist, Album, Track, DownloadLog

class ArtistSerializer(serializers.ModelSerializer):
    tracks_count = serializers.SerializerMethodField()
    albums_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Artist
        fields = '__all__'
    
    def get_tracks_count(self, obj):
        return obj.tracks.count()
    
    def get_albums_count(self, obj):
        return obj.albums.count()

class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.ReadOnlyField(source='artist.name')
    artist = ArtistSerializer(read_only=True)
    tracks_count = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = '__all__'
    
    def get_tracks_count(self, obj):
        return obj.tracks.count()

class TrackListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    artist_name = serializers.ReadOnlyField(source='artist.name')
    album_title = serializers.ReadOnlyField(source='album.title')
    album_cover = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = ['id', 'title', 'artist_name', 'album_title', 'album_cover', 'duration', 'genre', 'preview_file', 'file', 'created_at']

    def get_album_cover(self, obj):
        if obj.album.cover_image:
            return obj.album.cover_image.url
        return None

class TrackDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single track view"""
    artist = ArtistSerializer(read_only=True)
    album = AlbumSerializer(read_only=True)
    download_count = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = '__all__'
    
    def get_download_count(self, obj):
        return obj.downloads.count()

# Alias for backward compatibility
TrackSerializer = TrackListSerializer

class DownloadLogSerializer(serializers.ModelSerializer):
    track = TrackListSerializer(read_only=True)
    track_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DownloadLog
        fields = ['id', 'track', 'track_id', 'downloaded_at']
