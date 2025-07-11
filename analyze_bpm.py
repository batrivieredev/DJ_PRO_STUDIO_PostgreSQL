"""
Script d'analyse des BPM pour tous les morceaux:
- Lit les morceaux sans BPM dans la base de données
- Analyse les BPM avec librosa et les tags ID3
- Met à jour la base de données avec les résultats
"""

from app import create_app, db
from app.models import Track
import librosa
import numpy as np
from mutagen.mp3 import MP3
import os
from tqdm import tqdm

def analyze_track_bpm(file_path):
    """
    Analyse le BPM d'un fichier audio
    Retourne None en cas d'erreur
    """
    try:
        # D'abord essayer les tags ID3 pour les MP3
        if file_path.lower().endswith('.mp3'):
            try:
                audio = MP3(file_path)
                if audio.tags and 'TBPM' in audio.tags:
                    try:
                        bpm = float(audio.tags['TBPM'].text[0])
                        if 40 <= bpm <= 220:  # Valider la plage BPM
                            print(f"✨ BPM trouvé dans les tags: {bpm}")
                            return bpm
                    except (ValueError, IndexError, AttributeError):
                        pass
            except Exception as e:
                print(f"⚠️ Erreur lecture tags ID3: {str(e)}")

        # Si pas de BPM valide dans les tags, analyser l'audio
        print("🔍 Analyse audio...")
        y, sr = librosa.load(file_path, duration=30, sr=22050)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        bpm = round(tempo, 2)

        if 40 <= bpm <= 220:  # Valider le BPM détecté
            print(f"✅ BPM détecté: {bpm}")
            return bpm
        return None

    except Exception as e:
        print(f"❌ Erreur analyse {os.path.basename(file_path)}: {str(e)}")
        return None

def analyze_all_tracks():
    """
    Analyse tous les morceaux sans BPM et met à jour la base de données
    """
    app = create_app()

    with app.app_context():
        # Récupérer tous les morceaux sans BPM
        tracks = Track.query.filter(
            (Track.bpm.is_(None)) &
            (Track.file_path.isnot(None))
        ).all()

        if not tracks:
            print("✨ Tous les morceaux ont déjà un BPM!")
            return

        print(f"\n🎵 Analyse de {len(tracks)} morceaux...\n")

        # Analyser chaque morceau
        for track in tqdm(tracks, desc="Analyse BPM"):
            if not os.path.exists(track.file_path):
                print(f"❌ Fichier non trouvé: {track.file_path}")
                continue

            print(f"\n📝 Analyse de: {track.title}")
            bpm = analyze_track_bpm(track.file_path)

            if bpm:
                track.bpm = bpm
                try:
                    db.session.commit()
                    print(f"✅ BPM enregistré: {bpm}")
                except Exception as e:
                    db.session.rollback()
                    print(f"❌ Erreur sauvegarde en base: {str(e)}")
            else:
                print("⚠️ Impossible de détecter le BPM")

        print("\n✨ Analyse BPM terminée!")

if __name__ == '__main__':
    analyze_all_tracks()
