from django.db import models
from django.conf import settings

class Artist(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='artists/', blank=True, null=True)

    def __str__(self):
        return self.name

class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='albums')
    release_date = models.DateField()
    cover_image = models.ImageField(upload_to='albums/', blank=True, null=True)

    def __str__(self):
        return self.title

class Track(models.Model):
    title = models.CharField(max_length=255)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='tracks')
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks')
    file = models.FileField(upload_to='tracks/')
    preview_file = models.FileField(upload_to='previews/', blank=True, null=True)
    duration = models.PositiveIntegerField(help_text="Duration in seconds")
    genre = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class DownloadLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='downloads')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='downloads')
    downloaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} downloaded {self.track.title}"
