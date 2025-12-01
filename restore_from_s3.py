#!/usr/bin/env python
"""
Restore database from S3 files
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import boto3
from django.conf import settings
from music.models import Artist, Album, Track
from datetime import datetime

def restore_from_s3():
    print("Connecting to S3...")
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    print(f"Scanning bucket: {bucket}")

    # List all track files
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket, Prefix='media/tracks/')

    track_files = []
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if key.endswith('/'):
                    continue
                track_files.append(key)

    print(f"Found {len(track_files)} track files in S3")

    # List album covers
    preview_files = []
    pages = paginator.paginate(Bucket=bucket, Prefix='media/previews/')
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if key.endswith('/'):
                    continue
                preview_files.append(key)

    print(f"Found {len(preview_files)} preview files in S3")

    # List album covers
    cover_files = []
    pages = paginator.paginate(Bucket=bucket, Prefix='media/album_covers/')
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if key.endswith('/'):
                    continue
                cover_files.append(key)

    print(f"Found {len(cover_files)} album cover files in S3")

    print("\n=== S3 Files ===")
    print("Track files:", track_files[:5], "..." if len(track_files) > 5 else "")
    print("Preview files:", preview_files[:5], "..." if len(preview_files) > 5 else "")
    print("Cover files:", cover_files[:5], "..." if len(cover_files) > 5 else "")

    return {
        'tracks': track_files,
        'previews': preview_files,
        'covers': cover_files
    }

if __name__ == '__main__':
    try:
        files = restore_from_s3()
        print(f"\n✅ S3 scan complete!")
        print(f"   Tracks: {len(files['tracks'])}")
        print(f"   Previews: {len(files['previews'])}")
        print(f"   Covers: {len(files['covers'])}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
