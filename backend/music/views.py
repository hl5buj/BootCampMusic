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
                # Get original file extension
                import os
                from urllib.parse import quote
                
                original_filename = track.file.name
                file_extension = os.path.splitext(original_filename)[1] or '.mp3'
                
                # Make safe filename for download (handle korean/special chars)
                safe_artist = track.artist.name.replace('/', '_').replace('\\', '_')
                safe_title = track.title.replace('/', '_').replace('\\', '_')
                download_filename = f"{safe_artist} - {safe_title}{file_extension}"
                encoded_filename = quote(download_filename)

                # For S3 storage, generate presigned URL
                from django.conf import settings
                if hasattr(settings, 'USE_S3') and settings.USE_S3:
                    # Generate presigned URL for direct S3 download
                    import boto3
                    from botocore.config import Config

                    s3_client = boto3.client(
                        's3',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_S3_REGION_NAME,
                        config=Config(signature_version='s3v4')
                    )

                    # Construct S3 Key safely
                    s3_key = track.file.name
                    # If AWS_LOCATION is set (e.g. 'media') and key doesn't start with it, prepend it
                    if hasattr(settings, 'AWS_LOCATION') and settings.AWS_LOCATION:
                        location = settings.AWS_LOCATION
                        if not s3_key.startswith(f"{location}/"):
                            s3_key = f"{location}/{s3_key}"

                    # Generate presigned URL valid for 1 hour
                    # Use encoded filename for Content-Disposition
                    presigned_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                            'Key': s3_key,
                            'ResponseContentDisposition': f'attachment; filename="{download_filename}"; filename*=UTF-8\'\'{encoded_filename}'
                        },
                        ExpiresIn=3600
                    )

                    return Response({
                        "download_url": presigned_url,
                        "filename": download_filename
                    })
                else:
                    # For local storage, use FileResponse
                    response = FileResponse(
                        track.file.open(),
                        as_attachment=True,
                        filename=download_filename
                    )
                    response["Access-Control-Allow-Origin"] = "*"
                    return response

            except FileNotFoundError:
                return Response(
                    {"error": "File not found on server"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Download failed: {str(e)}", exc_info=True)
                # Return 500 error as JSON so frontend can handle it gracefully instead of crashing on .json()
                return Response(
                    {"error": f"Download failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # 1. Get or create the Artist
            artist_name = request.data.get('artist_name')
            logger.info(f"Creating/getting artist: {artist_name}")
            artist, _ = Artist.objects.get_or_create(
                name=artist_name,
                defaults={'bio': request.data.get('artist_bio', '')}
            )
            
            # 2. Get or create the Album
            album_title = request.data.get('album_title')
            logger.info(f"Creating/getting album: {album_title}")
            album, _ = Album.objects.get_or_create(
                title=album_title,
                artist=artist,
                defaults={
                    'release_date': request.data.get('release_date', '2024-01-01')
                }
            )
            
            # 3. Create the Track
            track_title = request.data.get('title')
            logger.info(f"Creating track: {track_title}")
            
            # Check if files are present
            if 'file' not in request.FILES:
                logger.error("No music file provided in upload")
                return Response(
                    {"error": "Music file is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            music_file = request.FILES.get('file')
            logger.info(f"Music file: {music_file.name}, size: {music_file.size} bytes")
            
            try:
                track = Track.objects.create(
                    title=track_title,
                    artist=artist,
                    album=album,
                    file=music_file,
                    preview_file=request.FILES.get('preview_file'),
                    duration=int(request.data.get('duration', 0)),
                    genre=request.data.get('genre', '')
                )
                logger.info(f"Track created successfully. File path: {track.file.name if track.file else 'None'}")
            except Exception as e:
                logger.error(f"Failed to create track: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Failed to upload track: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # 4. Handle Album Cover
            if 'album_cover' in request.FILES:
                logger.info("Uploading album cover from file")
                try:
                    album.cover_image = request.FILES['album_cover']
                    album.save()
                    logger.info(f"Album cover saved: {album.cover_image.name if album.cover_image else 'None'}")
                except Exception as e:
                    logger.error(f"Failed to save album cover: {str(e)}", exc_info=True)
            elif 'album_cover_url' in request.data:
                logger.info(f"Downloading album cover from URL: {request.data['album_cover_url']}")
                try:
                    import requests
                    from django.core.files.base import ContentFile
                    from django.utils.text import slugify
                    
                    image_url = request.data['album_cover_url']
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        # Use slugify to create a safe filename for S3
                        safe_filename = slugify(album.title) or "album-cover"
                        file_name = f"{safe_filename}.jpg"
                        
                        album.cover_image.save(
                            file_name,
                            ContentFile(response.content),
                            save=True
                        )
                        logger.info(f"Album cover downloaded and saved: {album.cover_image.name}")
                    else:
                        logger.warning(f"Failed to download cover image: HTTP {response.status_code}")
                except Exception as e:
                    logger.error(f"Failed to download cover image: {str(e)}", exc_info=True)
            
            logger.info(f"Upload completed successfully for track: {track.title}")
            return Response(
                TrackDetailSerializer(track).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Unexpected error in track upload: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Upload failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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

