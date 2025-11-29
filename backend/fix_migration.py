import sqlite3
import os

# Connect to database
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== Checking database structure ===")

# Check if genre column exists
cursor.execute("PRAGMA table_info(music_track)")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

print(f"Current columns in music_track: {column_names}")

if 'genre' not in column_names:
    print("\n❌ Genre column does NOT exist. Adding it now...")
    try:
        cursor.execute("ALTER TABLE music_track ADD COLUMN genre VARCHAR(100) DEFAULT '' NOT NULL")
        conn.commit()
        print("✅ Genre column added successfully!")
    except Exception as e:
        print(f"Error adding genre column: {e}")
else:
    print("\n✅ Genre column already exists!")

# Check track count
cursor.execute("SELECT COUNT(*) FROM music_track")
track_count = cursor.fetchone()[0]
print(f"\nTotal tracks in database: {track_count}")

if track_count > 0:
    cursor.execute("SELECT id, title, genre FROM music_track LIMIT 5")
    tracks = cursor.fetchall()
    print("\nFirst 5 tracks:")
    for track in tracks:
        print(f"  ID:{track[0]} | Title:{track[1]} | Genre:'{track[2]}'")

conn.close()
print("\n=== Done ===")
