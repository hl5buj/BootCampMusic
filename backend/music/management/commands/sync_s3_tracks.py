from django.core.management.base import BaseCommand
from django.conf import settings
from music.models import Track, Artist, Album
import boto3
from botocore.config import Config
import os
from urllib.parse import unquote

class Command(BaseCommand):
    help = 'Syncs tracks from S3 bucket to the database'

    def handle(self, *args, **options):
        if not settings.USE_S3:
            self.stdout.write(self.style.ERROR('S3 is not enabled in settings'))
            return

        self.stdout.write('Connecting to S3...')
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )

        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Prefix='media/tracks/'
        )

        count = 0
        restored = 0

        # Create a default artist/album for recovered tracks if needed
        unknown_artist, _ = Artist.objects.get_or_create(name="Unknown Artist")
        unknown_album, _ = Album.objects.get_or_create(
            title="Recovered Album", 
            artist=unknown_artist,
            defaults={'release_date': '2025-01-01'}
        )

        for page in pages:
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                key = obj['Key']
                if key.endswith('/'):  # Skip folders
                    continue
                    
                # Decode URL encoded filename (e.g. %20 -> space)
                decoded_key = unquote(key)
                filename = os.path.basename(decoded_key)
                
                # Check if file exists in DB (try both encoded and decoded or simple match)
                # We save with relative path in DB usually
                db_path = key # 'media/tracks/filename.mp3' usually stored as 'tracks/filename.mp3' by FileField
                # But FileField usually stores relative to MEDIA_ROOT. 
                # S3Boto3Storage stores relative to location='media'.
                # So DB value might be 'tracks/filename.mp3'
                
                # Let's try to find by checking if the file field contains the filename
                if Track.objects.filter(file__contains=filename).exists():
                    self.stdout.write(f'Skipping existing: {filename}')
                    continue

                # Parse Artist - Title from filename if possible
                # Format: "Artist - Title.mp3"
                title = filename
                artist = unknown_artist
                
                name_without_ext = os.path.splitext(filename)[0]
                if ' - ' in name_without_ext:
                    parts = name_without_ext.split(' - ', 1)
                    artist_name = parts[0].strip()
                    title = parts[1].strip()
                    artist, _ = Artist.objects.get_or_create(name=artist_name)
                
                # Create Track
                # Note: We need to set the file path relative to the media root (bucket root)
                # Or relative to 'media' folder? Django-storages usually expects path relative to location.
                # If location='media', and key='media/tracks/file.mp3', then field should be 'tracks/file.mp3'
                
                relative_path = key
                if key.startswith('media/'):
                    relative_path = key[6:] # remove 'media/'
                
                Track.objects.create(
                    title=title,
                    artist=artist,
                    album=unknown_album,
                    file=relative_path,
                    duration=180 # Default duration
                )
                
                self.stdout.write(self.style.SUCCESS(f'Restored: {title}'))
                restored += 1
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully processed. Restored {restored} tracks.'))
