import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from music.models import Track, Artist, Album

print(f"=== Database Status ===")
print(f"Tracks: {Track.objects.count()}")
print(f"Artists: {Artist.objects.count()}")
print(f"Albums: {Album.objects.count()}")
print()

if Track.objects.count() > 0:
    print("=== First 5 Tracks ===")
    for t in Track.objects.all()[:5]:
        print(f"- ID:{t.id} | {t.title} | Artist:{t.artist.name} | Album:{t.album.title} | Genre:'{t.genre}'")
else:
    print("No tracks found in database!")
