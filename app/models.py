from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime
import os

class User(UserMixin, db.Model):
    """Modèle pour les utilisateurs du système"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256))
    is_admin = db.Column(db.Boolean, default=False)
    can_access_mixer = db.Column(db.Boolean, default=False)  # Permission d'accès au mixer
    is_active = db.Column(db.Boolean, default=True)  # Compte actif ou désactivé
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    tracks = db.relationship('Track', backref='user', lazy=True)
    playlists = db.relationship('Playlist', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Track(db.Model):
    __tablename__ = 'tracks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    album = db.Column(db.String(200))
    genre = db.Column(db.String(100))
    bpm = db.Column(db.Float)
    key = db.Column(db.String(10))
    duration = db.Column(db.Float)  # Duration in seconds
    file_path = db.Column(db.String(500), nullable=False, unique=True)
    file_format = db.Column(db.String(10))  # mp3, wav, etc.
    file_size = db.Column(db.Integer)  # Size in bytes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_played = db.Column(db.DateTime)
    play_count = db.Column(db.Integer, default=0)
    waveform_data = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    playlist_entries = db.relationship('PlaylistTrack', backref='track', lazy=True, cascade='all, delete-orphan')
    cue_points = db.relationship('CuePoint', backref='track', lazy=True, cascade='all, delete-orphan')

    @property
    def exists(self):
        return os.path.exists(self.file_path)

    @property
    def folder_path(self):
        return os.path.dirname(self.file_path)

    @property
    def filename(self):
        return os.path.basename(self.file_path)

class Playlist(db.Model):
    __tablename__ = 'playlists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    folder_path = db.Column(db.String(500), nullable=True)  # Path to the folder containing the playlist
    is_auto = db.Column(db.Boolean, default=False)  # True if automatically created from folder
    is_smart = db.Column(db.Boolean, default=False)  # True if this is a smart playlist
    smart_rules = db.Column(db.JSON, nullable=True)  # Rules for smart playlists (genre, BPM range, etc)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    tracks = db.relationship('PlaylistTrack',
                           backref='playlist',
                           lazy=True,
                           order_by='PlaylistTrack.position',
                           cascade='all, delete-orphan')

    @property
    def track_count(self):
        return len(self.tracks)

    def add_track(self, track, position=None):
        if position is None:
            position = len(self.tracks)

        # Shift existing tracks if necessary
        if position < len(self.tracks):
            for pt in self.tracks:
                if pt.position >= position:
                    pt.position += 1

        playlist_track = PlaylistTrack(
            playlist_id=self.id,
            track_id=track.id,
            position=position
        )
        db.session.add(playlist_track)
        return playlist_track

    def remove_track(self, track):
        playlist_track = PlaylistTrack.query.filter_by(
            playlist_id=self.id,
            track_id=track.id
        ).first()

        if playlist_track:
            position = playlist_track.position
            db.session.delete(playlist_track)

            # Reorder remaining tracks
            for pt in self.tracks:
                if pt.position > position:
                    pt.position -= 1

    def reorder_tracks(self, track_ids):
        """Reorder tracks in the playlist based on list of track IDs"""
        position_map = {id: pos for pos, id in enumerate(track_ids)}
        for pt in self.tracks:
            if pt.track_id in position_map:
                pt.position = position_map[pt.track_id]

    @classmethod
    def create_from_folder(cls, folder_path, user_id):
        """Create a playlist from a folder of music files"""
        name = os.path.basename(folder_path)
        playlist = cls(
            name=name,
            folder_path=folder_path,
            is_auto=True,
            user_id=user_id
        )
        db.session.add(playlist)
        db.session.flush()  # Get playlist ID
        return playlist

class PlaylistTrack(db.Model):
    __tablename__ = 'playlist_tracks'

    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlists.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CuePoint(db.Model):
    __tablename__ = 'cue_points'

    id = db.Column(db.Integer, primary_key=True)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    name = db.Column(db.String(50))
    position = db.Column(db.Float, nullable=False)  # Position in seconds
    type = db.Column(db.String(20))  # hot_cue, memory_cue, loop_in, loop_out
    color = db.Column(db.String(7))  # Hex color code
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('track_id', 'position', 'type', name='unique_cue_position'),
    )
