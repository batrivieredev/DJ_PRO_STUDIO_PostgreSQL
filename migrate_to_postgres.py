"""
Data migration script from SQLite to PostgreSQL:
- Export data from SQLite
- Import data to PostgreSQL
- Verify data integrity
"""
import os
from pathlib import Path
import sys
from datetime import datetime
import json

# Add parent directory to PYTHONPATH to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Track, Playlist, PlaylistTrack, CuePoint

def backup_sqlite_data():
    """Export all data from SQLite to JSON file"""
    print("[*] Exporting SQLite data...")

    # Configure app to use SQLite
    app = create_app()
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    data = {
        'users': [],
        'tracks': [],
        'playlists': [],
        'playlist_tracks': [],
        'cue_points': []
    }

    with app.app_context():
        # Export users
        users = User.query.all()
        for user in users:
            data['users'].append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'password_hash': user.password_hash,
                'is_admin': user.is_admin,
                'can_access_mixer': user.can_access_mixer,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            })

        # Export tracks
        tracks = Track.query.all()
        for track in tracks:
            data['tracks'].append({
                'id': track.id,
                'title': track.title,
                'artist': track.artist,
                'album': track.album,
                'genre': track.genre,
                'bpm': track.bpm,
                'key': track.key,
                'duration': track.duration,
                'file_path': track.file_path,
                'file_format': track.file_format,
                'file_size': track.file_size,
                'created_at': track.created_at.isoformat() if track.created_at else None,
                'last_played': track.last_played.isoformat() if track.last_played else None,
                'play_count': track.play_count,
                'waveform_data': track.waveform_data,
                'user_id': track.user_id
            })

        # Export playlists
        playlists = Playlist.query.all()
        for playlist in playlists:
            data['playlists'].append({
                'id': playlist.id,
                'name': playlist.name,
                'description': playlist.description,
                'folder_path': playlist.folder_path,
                'is_auto': playlist.is_auto,
                'is_smart': playlist.is_smart,
                'smart_rules': playlist.smart_rules,
                'created_at': playlist.created_at.isoformat() if playlist.created_at else None,
                'updated_at': playlist.updated_at.isoformat() if playlist.updated_at else None,
                'user_id': playlist.user_id
            })

        # Export playlist tracks
        playlist_tracks = PlaylistTrack.query.all()
        for pt in playlist_tracks:
            data['playlist_tracks'].append({
                'id': pt.id,
                'playlist_id': pt.playlist_id,
                'track_id': pt.track_id,
                'position': pt.position,
                'created_at': pt.created_at.isoformat() if pt.created_at else None
            })

        # Export cue points
        cue_points = CuePoint.query.all()
        for cp in cue_points:
            data['cue_points'].append({
                'id': cp.id,
                'track_id': cp.track_id,
                'name': cp.name,
                'position': cp.position,
                'type': cp.type,
                'color': cp.color,
                'created_at': cp.created_at.isoformat() if cp.created_at else None
            })

    # Save to file
    backup_file = f'sqlite_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[+] Data exported to {backup_file}")
    return backup_file

def import_to_postgres(backup_file):
    """Import data from JSON file to PostgreSQL"""
    print("[*] Importing data to PostgreSQL...")

    # Configure app to use PostgreSQL
    app = create_app()

    with app.app_context():
        # Load backup data
        with open(backup_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Clear existing data
        print("[*] Clearing existing data...")
        db.drop_all()
        db.create_all()

        # Import users
        print("[*] Importing users...")
        for user_data in data['users']:
            user = User(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                is_admin=user_data['is_admin'],
                can_access_mixer=user_data['can_access_mixer'],
                is_active=user_data['is_active'],
                created_at=datetime.fromisoformat(user_data['created_at']) if user_data['created_at'] else None,
                last_login=datetime.fromisoformat(user_data['last_login']) if user_data['last_login'] else None
            )
            db.session.add(user)

        # Import tracks
        print("[*] Importing tracks...")
        for track_data in data['tracks']:
            track = Track(
                id=track_data['id'],
                title=track_data['title'],
                artist=track_data['artist'],
                album=track_data['album'],
                genre=track_data['genre'],
                bpm=track_data['bpm'],
                key=track_data['key'],
                duration=track_data['duration'],
                file_path=track_data['file_path'],
                file_format=track_data['file_format'],
                file_size=track_data['file_size'],
                created_at=datetime.fromisoformat(track_data['created_at']) if track_data['created_at'] else None,
                last_played=datetime.fromisoformat(track_data['last_played']) if track_data['last_played'] else None,
                play_count=track_data['play_count'],
                waveform_data=track_data['waveform_data'],
                user_id=track_data['user_id']
            )
            db.session.add(track)

        # Import playlists
        print("[*] Importing playlists...")
        for playlist_data in data['playlists']:
            playlist = Playlist(
                id=playlist_data['id'],
                name=playlist_data['name'],
                description=playlist_data['description'],
                folder_path=playlist_data['folder_path'],
                is_auto=playlist_data['is_auto'],
                is_smart=playlist_data['is_smart'],
                smart_rules=playlist_data['smart_rules'],
                created_at=datetime.fromisoformat(playlist_data['created_at']) if playlist_data['created_at'] else None,
                updated_at=datetime.fromisoformat(playlist_data['updated_at']) if playlist_data['updated_at'] else None,
                user_id=playlist_data['user_id']
            )
            db.session.add(playlist)

        # Import playlist tracks
        print("[*] Importing playlist tracks...")
        for pt_data in data['playlist_tracks']:
            pt = PlaylistTrack(
                id=pt_data['id'],
                playlist_id=pt_data['playlist_id'],
                track_id=pt_data['track_id'],
                position=pt_data['position'],
                created_at=datetime.fromisoformat(pt_data['created_at']) if pt_data['created_at'] else None
            )
            db.session.add(pt)

        # Import cue points
        print("[*] Importing cue points...")
        for cp_data in data['cue_points']:
            cp = CuePoint(
                id=cp_data['id'],
                track_id=cp_data['track_id'],
                name=cp_data['name'],
                position=cp_data['position'],
                type=cp_data['type'],
                color=cp_data['color'],
                created_at=datetime.fromisoformat(cp_data['created_at']) if cp_data['created_at'] else None
            )
            db.session.add(cp)

        db.session.commit()
        print("[+] Data imported successfully")

def verify_data_integrity():
    """Verify data integrity after migration"""
    print("[*] Verifying data integrity...")

    app = create_app()
    with app.app_context():
        users_count = User.query.count()
        tracks_count = Track.query.count()
        playlists_count = Playlist.query.count()
        playlist_tracks_count = PlaylistTrack.query.count()
        cue_points_count = CuePoint.query.count()

        print(f"""
[*] Database statistics:
    Users: {users_count}
    Tracks: {tracks_count}
    Playlists: {playlists_count}
    Playlist tracks: {playlist_tracks_count}
    Cue points: {cue_points_count}
        """)

def main():
    """Execute complete migration"""
    start_time = datetime.now()
    print(f"[*] Starting PostgreSQL migration ({start_time})")

    try:
        # Backup SQLite data
        backup_file = backup_sqlite_data()

        # Import to PostgreSQL
        import_to_postgres(backup_file)

        # Verify data
        verify_data_integrity()

        end_time = datetime.now()
        duration = end_time - start_time
        print(f"[+] Migration completed in {duration}")

    except Exception as e:
        print(f"[!] Error during migration: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
