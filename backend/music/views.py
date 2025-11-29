from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.db.models import Q, Count
from .models import Track, DownloadLog, Artist, Album
from .serializers import (
    TrackListSerializer, 
    TrackDetailSerializer,
    ArtistSerializer, 
    AlbumSerializer,
    DownloadLogSerializer
)

class TrackListView(generics.ListAPIView):
    """List all tracks with search and filtering"""
    serializer_class = TrackListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'artist__name', 'album__title', 'genre']
    ordering_fields = ['created_at', 'title', 'duration']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Track.objects.select_related('artist', 'album').all()
        
        # Filter by artist
        artist_id = self.request.query_params.get('artist', None)
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        
        # Filter by album
        album_id = self.request.query_params.get('album', None)
        if album_id:
            queryset = queryset.filter(album_id=album_id)

        # Filter by genre
        genre = self.request.query_params.get('genre', None)
        if genre:
            queryset = queryset.filter(genre__iexact=genre)
        
        return queryset

class TrackDetailView(generics.RetrieveAPIView):
    """Get detailed information about a single track"""
    queryset = Track.objects.select_related('artist', 'album').all()
    serializer_class = TrackDetailSerializer
    permission_classes = [permissions.AllowAny]

class DownloadTrackView(APIView):
    """Download a track file (requires authentication)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        track = get_object_or_404(Track, pk=pk)
        
        # Log download
        DownloadLog.objects.create(user=request.user, track=track)
        
        # Serve file
        if track.file:
            try:
                response = FileResponse(
                    track.file.open(), 
                    as_attachment=True, 
                    filename=f"{track.artist.name} - {track.title}.mp3"
                )
                # Add CORS headers for cross-origin downloads
                response["Access-Control-Allow-Origin"] = "*"
                response["Access-Control-Allow-Credentials"] = "true"
                return response
            except FileNotFoundError:
                return Response(
                    {"error": "File not found on server"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(
            {"error": "No file associated with this track"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def log_download(request, pk):
    """Log a download without serving the file"""
    track = get_object_or_404(Track, pk=pk)
    DownloadLog.objects.create(user=request.user, track=track)
    return Response({"message": "Download logged successfully"}, status=status.HTTP_201_CREATED)

class ArtistListView(generics.ListAPIView):
    """List all artists with track/album counts"""
    queryset = Artist.objects.annotate(
        tracks_count=Count('tracks'),
        albums_count=Count('albums')
    ).all()
    serializer_class = ArtistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'tracks_count']

class ArtistDetailView(generics.RetrieveAPIView):
    """Get detailed information about an artist"""
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [permissions.AllowAny]

class AlbumListView(generics.ListAPIView):
    """List all albums with filtering"""
    serializer_class = AlbumSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'artist__name']
    ordering_fields = ['release_date', 'title']
    ordering = ['-release_date']
    
    def get_queryset(self):
        queryset = Album.objects.select_related('artist').all()
        
        # Filter by artist
        artist_id = self.request.query_params.get('artist', None)
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        
        return queryset

class AlbumDetailView(generics.RetrieveAPIView):
    """Get detailed information about an album"""
    queryset = Album.objects.select_related('artist').all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.AllowAny]

class UserDownloadListView(generics.ListAPIView):
    """List all downloads for the authenticated user"""
    serializer_class = DownloadLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DownloadLog.objects.filter(
            user=self.request.user
        ).select_related('track__artist', 'track__album').order_by('-downloaded_at')

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_all(request):
    """Search across tracks, artists, and albums"""
    query = request.query_params.get('q', '')
    
    if not query:
        return Response({
            "tracks": [],
            "artists": [],
            "albums": []
        })
    
    # Search tracks
    tracks = Track.objects.filter(
        Q(title__icontains=query) |
        Q(artist__name__icontains=query) |
        Q(album__title__icontains=query)
    ).select_related('artist', 'album')[:10]
    
    # Search artists
    artists = Artist.objects.filter(name__icontains=query)[:10]
    
    # Search albums
    albums = Album.objects.filter(
        Q(title__icontains=query) |
        Q(artist__name__icontains=query)
    ).select_related('artist')[:10]
    
    return Response({
        "tracks": TrackListSerializer(tracks, many=True).data,
        "artists": ArtistSerializer(artists, many=True).data,
        "albums": AlbumSerializer(albums, many=True).data
    })

# Admin Upload Views
class TrackUploadView(APIView):
    """Upload a new track (admin only)"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        # 1. Get or create the Artist
        # We check if the artist exists by name, if not create a new one.
        artist_name = request.data.get('artist_name')
        artist, _ = Artist.objects.get_or_create(
            name=artist_name,
            defaults={'bio': request.data.get('artist_bio', '')}
        )
        
        # 2. Get or create the Album
        # Albums are linked to the artist.
        album_title = request.data.get('album_title')
        album, _ = Album.objects.get_or_create(
            title=album_title,
            artist=artist,
            defaults={
                'release_date': request.data.get('release_date', '2024-01-01')
            }
        )
        
        # 3. Create the Track
        # Create the track instance with the uploaded files and metadata.
        track = Track.objects.create(
            title=request.data.get('title'),
            artist=artist,
            album=album,
            file=request.FILES.get('file'),
            preview_file=request.FILES.get('preview_file'),
            duration=int(request.data.get('duration', 0)),
            genre=request.data.get('genre', '')
        )
        
        # 4. Handle Album Cover
        # If an album cover is provided, update the album's cover image.
        if 'album_cover' in request.FILES:
            album.cover_image = request.FILES['album_cover']
            album.save()
        
        return Response(
            TrackDetailSerializer(track).data,
            status=status.HTTP_201_CREATED
        )

class ArtistCreateView(generics.CreateAPIView):
    """Create a new artist (admin only)"""
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [permissions.IsAdminUser]

class AlbumCreateView(generics.CreateAPIView):
    """Create a new album (admin only)"""
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAdminUser]

class TrackUpdateView(generics.UpdateAPIView):
    """Update a track (admin only)"""
    queryset = Track.objects.all()
    serializer_class = TrackDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    
    parser_classes = [MultiPartParser, FormParser]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 1. Handle Artist Update
        # If artist name is changed, find or create the new artist.
        if 'artist_name' in request.data:
            artist, _ = Artist.objects.get_or_create(
                name=request.data['artist_name'],
                defaults={'bio': request.data.get('artist_bio', '')}
            )
            instance.artist = artist
        
        # 2. Handle Album Update
        # If album title is changed, find or create the new album.
        if 'album_title' in request.data:
            album, created = Album.objects.get_or_create(
                title=request.data['album_title'],
                artist=instance.artist,
                defaults={'release_date': request.data.get('release_date', '2024-01-01')}
            )
            
            # If album existed, update release_date if provided
            if not created and 'release_date' in request.data:
                album.release_date = request.data['release_date']
                album.save()

            instance.album = album
            
            # Update album cover if provided
            if 'album_cover' in request.FILES:
                album.cover_image = request.FILES['album_cover']
                album.save()
        
        # 3. Update Track Fields
        # Update standard fields and files.
        if 'title' in request.data:
            instance.title = request.data['title']
        if 'duration' in request.data:
            instance.duration = int(request.data['duration'])
        if 'file' in request.FILES:
            instance.file = request.FILES['file']
        if 'preview_file' in request.FILES:
            instance.preview_file = request.FILES['preview_file']
        if 'genre' in request.data:
            instance.genre = request.data['genre']
        
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class TrackDeleteView(generics.DestroyAPIView):
    """Delete a track (admin only)"""
    queryset = Track.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Delete associated files
        if instance.file:
            instance.file.delete()
        if instance.preview_file:
            instance.preview_file.delete()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

