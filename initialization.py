"""
Script d'initialisation rapide du système:
- Crée les tables de la base de données
- Crée l'utilisateur admin par défaut
- Scanne le dossier /var/www/html/dj/musiques et crée playlists + tracks,
  y compris les MP3 isolés dans le dossier principal.
"""
import os
import sys
import time
from datetime import timedelta
from mutagen.mp3 import MP3
import librosa

# Ajoute le dossier parent au PYTHONPATH pour pouvoir importer app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Track, Playlist, PlaylistTrack

def print_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=50, fill='█', print_end="\r"):
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '-' * (length - filled_length)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end=print_end)
    if iteration == total:
        print()

def format_time(seconds):
    return str(timedelta(seconds=int(seconds)))

def process_audio_file(file_path, playlist, user_id, current_file, total_files, start_time):
    try:
        track = Track.query.filter_by(file_path=file_path, user_id=user_id).first()
        if not track:
            audio = MP3(file_path)
            title = os.path.splitext(os.path.basename(file_path))[0]
            artist = "Unknown Artist"
            if audio.tags:
                try:
                    title = audio.tags.get('TIT2', [title])[0].text[0]
                    artist = audio.tags.get('TPE1', [artist])[0].text[0]
                except Exception:
                    pass

            elapsed_time = time.time() - start_time
            files_per_second = current_file / elapsed_time if elapsed_time > 0 else 0
            remaining_files = total_files - current_file
            eta = remaining_files / files_per_second if files_per_second > 0 else 0

            print_progress_bar(current_file, total_files,
                               prefix=f'Processing: {title[:30]}...',
                               suffix=f'ETA: {format_time(eta)}',
                               length=30)

            bpm = None
            try:
                y, sr = librosa.load(file_path, duration=30, sr=22050)
                onset_env = librosa.onset.onset_strength(y=y, sr=sr)
                tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
                if 40 <= tempo <= 220:
                    bpm = round(float(tempo), 2)
            except Exception:
                bpm = None

            track = Track(
                title=title,
                artist=artist,
                bpm=bpm,
                key="",
                file_path=file_path,
                file_format="mp3",
                file_size=os.path.getsize(file_path),
                user_id=user_id
            )
            db.session.add(track)
            db.session.commit()

            position = PlaylistTrack.query.filter_by(playlist_id=playlist.id).count()
            playlist_track = PlaylistTrack(
                playlist_id=playlist.id,
                track_id=track.id,
                position=position
            )
            db.session.add(playlist_track)
            db.session.commit()
        return track
    except Exception as e:
        print(f"\n❌ Error processing {file_path}: {str(e)}")
        db.session.rollback()
        return None

def count_mp3_files(directory):
    count = 0
    for root, _, files in os.walk(directory):
        count += sum(1 for f in files if f.lower().endswith('.mp3'))
    return count

def scan_music_folders(main_dir, user_id):
    print(f"\n📂 Processing main music directory: {main_dir}")
    try:
        # Sous-dossiers directs (playlists)
        subdirs = [d for d in os.listdir(main_dir) if os.path.isdir(os.path.join(main_dir, d)) and not d.startswith('.')]
        # MP3 dans dossier principal sans sous-dossier
        singles = [f for f in os.listdir(main_dir)
                   if os.path.isfile(os.path.join(main_dir, f)) and f.lower().endswith('.mp3')]

        if not subdirs and not singles:
            print("⚠️ Aucun dossier ni fichier MP3 trouvé dans le dossier musique")
            return

        total_files = sum(count_mp3_files(os.path.join(main_dir, sd)) for sd in subdirs) + len(singles)
        print(f"\n📊 Total MP3 files à traiter: {total_files}")

        current_file = 0
        start_time = time.time()

        # Traite chaque sous-dossier comme une playlist
        for subdir in subdirs:
            folder_path = os.path.join(main_dir, subdir)
            print(f"\n🎵 Traitement du dossier : {subdir}")

            music_files = []
            for root, _, files in os.walk(folder_path):
                for f in files:
                    if f.lower().endswith('.mp3'):
                        music_files.append(os.path.join(root, f))

            if music_files:
                playlist = Playlist.query.filter_by(folder_path=folder_path, user_id=user_id).first()
                if not playlist:
                    playlist = Playlist(
                        name=subdir,
                        folder_path=folder_path,
                        is_auto=True,
                        user_id=user_id
                    )
                    db.session.add(playlist)
                    db.session.commit()

                for file_path in music_files:
                    current_file += 1
                    process_audio_file(file_path, playlist, user_id, current_file, total_files, start_time)

                print(f"\n✅ Fin du traitement de {subdir}")
            else:
                print(f"⚠️ Aucun fichier MP3 dans {subdir}")

        # Crée une playlist spéciale pour les MP3 seuls dans le dossier principal
        if singles:
            print(f"\n🎵 Traitement des MP3 seuls dans {main_dir} (playlist 'Singles')")

            singles_playlist = Playlist.query.filter_by(name="Singles", user_id=user_id).first()
            if not singles_playlist:
                singles_playlist = Playlist(
                    name="Singles",
                    folder_path=main_dir,
                    is_auto=True,
                    user_id=user_id
                )
                db.session.add(singles_playlist)
                db.session.commit()

            for single_file in singles:
                current_file += 1
                file_path = os.path.join(main_dir, single_file)
                process_audio_file(file_path, singles_playlist, user_id, current_file, total_files, start_time)

            print(f"\n✅ Fin du traitement des MP3 seuls")

    except Exception as e:
        print(f"❌ Erreur lors du scan des dossiers musique: {str(e)}")
        db.session.rollback()

def initialize_system():
    start_time = time.time()
    total_steps = 4
    current_step = 0

    app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)

    current_step += 1
    print_progress_bar(current_step, total_steps, prefix='Progression initialisation:', suffix='Création de l\'app')

    app = create_app()

    # Configuration DB PostgreSQL ou SQLite
    if os.getenv('DB_TYPE', 'sqlite') == 'postgresql':
        db_uri = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    else:
        db_path = os.path.join(app_dir, 'app.db')
        db_uri = f'sqlite:///{db_path}'

    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri

    # Dossier musique
    app.config['MUSIC_FOLDER'] = os.getenv('MUSIC_DIR', '/var/www/html/dj/musiques')

    with app.app_context():
        current_step += 1
        print_progress_bar(current_step, total_steps, prefix='Progression initialisation:', suffix='Création de la base')

        try:
            db.session.execute('SELECT 1 FROM playlists')
            print("\n✓ Les tables existent déjà, suppression des données...")
        except Exception:
            print("\n⚠️ Tables non trouvées, création du schéma...")
        db.drop_all()
        db.create_all()
        db.session.commit()

        current_step += 1
        print_progress_bar(current_step, total_steps, prefix='Progression initialisation:', suffix='Création de l\'admin')

        print("\n👤 Création de l'utilisateur admin...")
        admin = User(
            username='admin',
            email='admin@example.com',
            is_admin=True,
            is_active=True,
            can_access_mixer=True,
        )
        admin.set_password('admin')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin créé")

        current_step += 1
        print_progress_bar(current_step, total_steps, prefix='Progression initialisation:', suffix='Scan musique')

        music_dir = app.config['MUSIC_FOLDER']

        if os.path.exists(music_dir) and os.path.isdir(music_dir):
            print(f"✓ Début du scan de : {music_dir}")
            scan_music_folders(music_dir, admin.id)
        else:
            print(f"⚠️ Dossier musique introuvable : {music_dir}")

        total_time = time.time() - start_time
        print(f"\n✅ Initialisation terminée ! ({format_time(total_time)})")
        print("🔑 Connexion avec admin/admin")

if __name__ == '__main__':
    initialize_system()
