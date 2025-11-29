"""
Generate sample audio files for testing the music platform.
Creates simple beep sounds at different frequencies for each track.
"""
import os
import sys
import django
import wave
import struct
import math

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from music.models import Track

def generate_beep(filename, frequency=440, duration=3, sample_rate=44100):
    """Generate a simple beep sound at the given frequency (Optimized)"""
    # Generate 1 second of audio
    one_sec_samples = int(sample_rate)
    audio_data = bytearray()
    
    for i in range(one_sec_samples):
        value = int(32767.0 * 0.3 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
        audio_data.extend(struct.pack('<h', value))
    
    # Write to file
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        # Write full seconds
        full_seconds = int(duration)
        for _ in range(full_seconds):
            wav_file.writeframes(audio_data)
            
        # Write remaining part
        remaining_duration = duration - full_seconds
        if remaining_duration > 0:
            remaining_samples = int(remaining_duration * sample_rate)
            wav_file.writeframes(audio_data[:remaining_samples * 2]) # *2 for 2 bytes per sample
            
    print(f"Generated: {filename} ({duration}s)")

def create_sample_audio_files():
    """Create sample audio files for all tracks"""
    
    # Create directories if they don't exist
    os.makedirs('media/previews', exist_ok=True)
    os.makedirs('media/tracks', exist_ok=True)
    
    # Get all tracks
    tracks = Track.objects.all()
    
    # Different frequencies for different tracks to make them distinguishable
    frequencies = [440, 523, 587, 659, 698, 784, 880, 988, 1047]  # Musical notes
    
    for idx, track in enumerate(tracks):
        freq = frequencies[idx % len(frequencies)]
        
        # Generate preview file (3 seconds)
        preview_filename = f"previews/{track.title.replace(' ', '_').lower()}_preview.wav"
        preview_path = os.path.join('media', preview_filename)
        generate_beep(preview_path, frequency=freq, duration=3)
        
        # Generate full track file (use actual duration)
        track_filename = f"tracks/{track.title.replace(' ', '_').lower()}.wav"
        track_path = os.path.join('media', track_filename)
        # Use track.duration if available, else default to 180
        duration = track.duration if track.duration > 0 else 180
        # Limit to 30 seconds for sample generation speed/size if needed, but user asked for full duration.
        # Let's cap at 60 seconds to avoid huge files during dev, or use full if user insists.
        # User said "Duration에 설정된 시간동안...". Let's use full duration but maybe lower sample rate or just do it.
        # Beep sound compresses well? No, it's raw WAV. 
        # 3 minutes * 44100 * 2 bytes = ~15MB per song. 10 songs = 150MB. Acceptable.
        generate_beep(track_path, frequency=freq, duration=duration)
        
        # Update track in database
        track.preview_file = preview_filename
        track.file = track_filename
        track.save()
        
        print(f"Updated track: {track.title}")
    
    print(f"\nSuccessfully created audio files for {tracks.count()} tracks!")
    print("Preview files: media/previews/")
    print("Track files: media/tracks/")

if __name__ == '__main__':
    print("Generating sample audio files... SKIPPED (Using existing files)")
    print("=" * 50)
    # create_sample_audio_files()
    print("=" * 50)
    print("Done!")
