import os
import django
import sys
from datetime import date
import random

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from music.models import Artist, Album, Track
from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_data():
    print("Creating sample music data from existing files...")
    
    # 1. Find existing audio files
    media_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media')
    tracks_dir = os.path.join(media_root, 'tracks')
    albums_dir = os.path.join(media_root, 'albums')
    
    if not os.path.exists(tracks_dir):
        print(f"Tracks directory not found: {tracks_dir}")
        return

    audio_extensions = ('.mp3', '.wav', '.flac', '.m4a')
    audio_files = [f for f in os.listdir(tracks_dir) if f.lower().endswith(audio_extensions)]
    
    if not audio_files:
        print("No audio files found in media/tracks. Please add some music files first.")
        return

    print(f"Found {len(audio_files)} audio files.")

    # 2. Find existing cover images
    image_extensions = ('.jpg', '.jpeg', '.png')
    cover_images = []
    if os.path.exists(albums_dir):
        cover_images = [f for f in os.listdir(albums_dir) if f.lower().endswith(image_extensions)]
    
    print(f"Found {len(cover_images)} cover images.")

    # 3. Create Artists
    artists_data = [
        {"name": "The Beatles", "bio": "Legendary British rock band"},
        {"name": "Queen", "bio": "British rock band formed in London"},
        {"name": "Pink Floyd", "bio": "English rock band"},
        {"name": "Led Zeppelin", "bio": "English rock band formed in London"},
        {"name": "Unknown Artist", "bio": "Various artists"},
    ]
    
    artists = []
    for data in artists_data:
        artist, _ = Artist.objects.get_or_create(name=data['name'], defaults={'bio': data['bio']})
        artists.append(artist)

    # 4. Create Albums
    albums_data = [
        {"title": "Greatest Hits", "release_date": date(1980, 1, 1)},
        {"title": "Summer Vibes", "release_date": date(2023, 6, 15)},
        {"title": "Classic Rock", "release_date": date(1975, 11, 21)},
        {"title": "Chill Mix", "release_date": date(2024, 1, 1)},
    ]
    
    albums = []
    for i, data in enumerate(albums_data):
        # Assign a random cover image if available
        cover_image = None
        if cover_images:
            # Cycle through images or pick random
            img_name = cover_images[i % len(cover_images)]
            cover_image = f"albums/{img_name}"
            
        album, _ = Album.objects.get_or_create(
            title=data['title'],
            artist=random.choice(artists),
            defaults={
                'release_date': data['release_date'],
                'cover_image': cover_image
            }
        )
        # Force update cover image if it was created before without one
        if cover_image and album.cover_image != cover_image:
            album.cover_image = cover_image
            album.save()
            
        albums.append(album)

    # 5. Create Tracks from Files
    # Clear existing tracks to avoid duplicates if re-running? 
    # Maybe better to update_or_create based on title derived from filename.
    
    for filename in audio_files:
        # Simple title extraction: remove extension, replace underscores
        title = os.path.splitext(filename)[0].replace('_', ' ').replace('.', ' ')
        
        # Assign random artist and album
        artist = random.choice(artists)
        album = random.choice(albums)
        
        # File path relative to MEDIA_ROOT
        file_path = f"tracks/{filename}"
        
        # Create or update track
        Track.objects.update_or_create(
            title=title,
            defaults={
                'artist': artist,
                'album': album,
                'duration': 180, # Default duration, will be updated if we parse metadata later
                'file': file_path,
                'preview_file': file_path # Use full file for preview as requested
            }
        )
        print(f"Processed track: {title}")

    print(f"Total tracks in database: {Track.objects.count()}")
    print("Sample data creation complete!")

if __name__ == '__main__':
    create_sample_data()
