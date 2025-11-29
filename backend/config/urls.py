from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import RegisterView, MeView
from music.views import (
    TrackListView, TrackDetailView, DownloadTrackView, 
    ArtistListView, ArtistDetailView,
    AlbumListView, AlbumDetailView,
    UserDownloadListView, search_all, log_download,
    TrackUploadView, ArtistCreateView, AlbumCreateView,
    TrackUpdateView, TrackDeleteView
)
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', obtain_auth_token, name='login'),
    path('api/auth/me/', MeView.as_view(), name='me'),

    # Search
    path('api/search/', search_all, name='search-all'),

    # Music - Tracks
    path('api/music/tracks/', TrackListView.as_view(), name='track-list'),
    path('api/music/tracks/<int:pk>/', TrackDetailView.as_view(), name='track-detail'),
    path('api/music/tracks/<int:pk>/download/', DownloadTrackView.as_view(), name='track-download'),
    path('api/music/tracks/<int:pk>/log-download/', log_download, name='log-download'),
    
    # Music - Artists
    path('api/music/artists/', ArtistListView.as_view(), name='artist-list'),
    path('api/music/artists/<int:pk>/', ArtistDetailView.as_view(), name='artist-detail'),
    
    # Music - Albums
    path('api/music/albums/', AlbumListView.as_view(), name='album-list'),
    path('api/music/albums/<int:pk>/', AlbumDetailView.as_view(), name='album-detail'),
    
    # User Downloads
    path('api/music/downloads/', UserDownloadListView.as_view(), name='user-downloads'),
    
    # Admin - Upload
    path('api/admin/upload-track/', TrackUploadView.as_view(), name='admin-upload-track'),
    path('api/admin/create-artist/', ArtistCreateView.as_view(), name='admin-create-artist'),
    path('api/admin/create-album/', AlbumCreateView.as_view(), name='admin-create-album'),
    path('api/admin/update-track/<int:pk>/', TrackUpdateView.as_view(), name='admin-update-track'),
    path('api/admin/delete-track/<int:pk>/', TrackDeleteView.as_view(), name='admin-delete-track'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
