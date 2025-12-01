#!/usr/bin/env python
"""
Restore album covers from S3 media/albums/
"""
import os
import sys
import django

sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import boto3
from django.conf import settings
from music.models import Album

def restore_album_covers():
    print("=" * 60)
    print("Album Cover Restoration from S3")
    print("=" * 60)

    # Connect to S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )

    bucket = settings.AWS_STORAGE_BUCKET_NAME

    # Find all files in media/albums/
    print(f"Scanning S3 bucket: {bucket}")
    print(f"Looking in: media/albums/\n")

    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket, Prefix='media/albums/')

    cover_files = []
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('/'):
                    cover_files.append(key)

    print(f"Found {len(cover_files)} album cover files\n")

    if not cover_files:
        print("❌ No album covers found in S3!")
        return

    # Display found covers
    print("Album covers found:")
    for cover in cover_files[:10]:
        print(f"  - {cover}")
    if len(cover_files) > 10:
        print(f"  ... and {len(cover_files) - 10} more")
    print()

    # Get all albums
    albums = Album.objects.all()
    print(f"Found {albums.count()} albums in database\n")

    updated = 0
    for album in albums:
        # Try to find matching cover
        album_slug = album.title.lower().replace(' ', '_').replace('-', '_')

        matched_cover = None
        for cover_file in cover_files:
            cover_name = os.path.basename(cover_file).lower()
            if album_slug in cover_name or album.artist.name.lower().replace(' ', '_') in cover_name:
                matched_cover = cover_file
                break

        if matched_cover:
            # Update album with cover path (relative to media/)
            cover_path = matched_cover.replace('media/', '')
            album.cover_image = cover_path
            album.save()
            print(f"✅ Updated: {album.title} -> {os.path.basename(matched_cover)}")
            updated += 1
        else:
            print(f"⏭️  No match: {album.title}")

    print()
    print("=" * 60)
    print(f"✅ Updated {updated} albums with cover images")
    print("=" * 60)

    # If many covers not matched, assign first available to albums without covers
    if updated < len(cover_files) and updated < albums.count():
        print("\n🔄 Assigning remaining covers to albums without images...")
        albums_without_covers = Album.objects.filter(cover_image__isnull=True) | Album.objects.filter(cover_image='')

        used_covers = set()
        for album in albums.exclude(cover_image__isnull=True).exclude(cover_image=''):
            if album.cover_image:
                used_covers.add(album.cover_image.name)

        available_covers = [c for c in cover_files if c.replace('media/', '') not in used_covers]

        extra_updated = 0
        for album, cover_file in zip(albums_without_covers, available_covers):
            cover_path = cover_file.replace('media/', '')
            album.cover_image = cover_path
            album.save()
            print(f"✅ Assigned: {album.title} -> {os.path.basename(cover_file)}")
            extra_updated += 1

        print(f"\n✅ Assigned {extra_updated} additional covers")

if __name__ == '__main__':
    restore_album_covers()
