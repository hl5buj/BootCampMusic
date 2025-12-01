#!/usr/bin/env python
"""
Restore database from S3 files
"""
import os
import sys
import django
import re

# Setup Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import boto3
from django.conf import settings
from music.models import Artist, Album, Track
from datetime import datetime

def parse_filename(filename):
    """
    Parse filename like: '01._가을을_남기고_간_사랑-패티김.flac'
    Returns: (title, artist, extension)
    """
    # Remove path and get just filename
    basename = os.path.basename(filename)

    # Remove track number prefix (e.g., "01._")
    basename = re.sub(r'^\d+\._', '', basename)

    # Split by extension
    name, ext = os.path.splitext(basename)

    # Split by last dash to separate title and artist
    if '-' in name:
        parts = name.rsplit('-', 1)
        title = parts[0].replace('_', ' ').strip()
        artist = parts[1].replace('_', ' ').strip() if len(parts) > 1 else "Unknown Artist"
    else:
        title = name.replace('_', ' ').strip()
        artist = "Unknown Artist"

    return title, artist, ext.lstrip('.')

def get_file_size(s3_client, bucket, key):
    """Get file size from S3"""
    try:
        response = s3_client.head_object(Bucket=bucket, Key=key)
        return response.get('ContentLength', 0)
    except:
        return 0

def restore_tracks(dry_run=False):
    print("=" * 60)
    print("Database Restoration from S3")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE (will modify database)'}")
    print()

    # Connect to S3
    print("Connecting to S3...")
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )

    bucket = settings.AWS_STORAGE_BUCKET_NAME

    # Get all track files
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket, Prefix='media/tracks/')

    track_files = []
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('/'):
                    track_files.append(key)

    print(f"Found {len(track_files)} track files in S3\n")

    # Get preview files mapping
    preview_map = {}
    pages = paginator.paginate(Bucket=bucket, Prefix='media/previews/')
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('/'):
                    basename = os.path.basename(key)
                    preview_map[basename] = key

    # Get album cover mapping
    cover_map = {}
    for prefix in ['media/album_covers/', 'media/covers/', 'album_covers/', 'covers/']:
        pages = paginator.paginate(Bucket=bucket, Prefix=prefix)
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    if not key.endswith('/'):
                        basename = os.path.basename(key)
                        cover_map[basename] = key

    print(f"Found {len(preview_map)} preview files")
    print(f"Found {len(cover_map)} album cover files\n")

    # Process each track
    created_count = 0
    skipped_count = 0

    for track_file in track_files:
        try:
            # Parse filename
            title, artist_name, ext = parse_filename(track_file)

            # Check if track already exists
            if Track.objects.filter(title=title, artist__name=artist_name).exists():
                print(f"⏭️  SKIP: {title} - {artist_name} (already exists)")
                skipped_count += 1
                continue

            print(f"📀 Processing: {title} - {artist_name}")

            if not dry_run:
                # Get or create artist
                artist, created = Artist.objects.get_or_create(
                    name=artist_name,
                    defaults={'bio': f'Artist: {artist_name}'}
                )
                if created:
                    print(f"   ✨ Created artist: {artist_name}")

                # Get or create album (use artist name as album for now)
                album, created = Album.objects.get_or_create(
                    title=f"{artist_name} Album",
                    artist=artist,
                    defaults={'release_date': '2024-01-01'}
                )
                if created:
                    print(f"   ✨ Created album: {album.title}")

                # Look for preview file
                track_basename = os.path.basename(track_file)
                preview_file = preview_map.get(track_basename, None)

                # Estimate duration (default 180 seconds)
                duration = 180

                # Create track - store relative path from media/
                # S3 storage expects path relative to STORAGES location
                file_path = track_file.replace('media/', '')
                preview_path = preview_file.replace('media/', '') if preview_file else None

                track = Track.objects.create(
                    title=title,
                    artist=artist,
                    album=album,
                    file=file_path,
                    preview_file=preview_path,
                    duration=duration,
                    genre='Unknown'
                )

                print(f"   ✅ Created track: {track.title}")
                created_count += 1
            else:
                print(f"   [DRY RUN] Would create: {title} - {artist_name}")
                created_count += 1

        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            continue

    print()
    print("=" * 60)
    print("Restoration Summary")
    print("=" * 60)
    print(f"Total files in S3: {len(track_files)}")
    print(f"Tracks created: {created_count}")
    print(f"Tracks skipped: {skipped_count}")
    print()

    if not dry_run:
        print(f"✅ Database restored successfully!")
        print(f"   Artists: {Artist.objects.count()}")
        print(f"   Albums: {Album.objects.count()}")
        print(f"   Tracks: {Track.objects.count()}")
    else:
        print("ℹ️  This was a DRY RUN. Run with dry_run=False to apply changes.")

if __name__ == '__main__':
    import sys
    dry_run = '--dry-run' in sys.argv or '-n' in sys.argv
    restore_tracks(dry_run=dry_run)
