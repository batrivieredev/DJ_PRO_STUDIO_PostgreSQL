import unittest
import os
from pathlib import Path
from app import create_app, db
from app.models import User, Track, Playlist, PlaylistTrack
import shutil
import tempfile
import mutagen
from mutagen.mp3 import MP3
import threading

class TestDJSystem(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory
        self.test_dir = tempfile.mkdtemp()
        self.uploads_dir = os.path.join(self.test_dir, 'uploads')
        os.makedirs(self.uploads_dir)

        # Configure test app
        self.app = create_app()
        self.app.config.update({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{os.path.join(self.test_dir, "test.db")}',
            'UPLOAD_FOLDER': self.uploads_dir,
            'WTF_CSRF_ENABLED': False,
            'SQLALCHEMY_TRACK_MODIFICATIONS': False
        })

        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.req_ctx = self.app.test_request_context()
        self.req_ctx.push()

        # Initialize database in app context
        with self.app.app_context():
            db.create_all()

        # Create test user
        # Create test user with unique email using timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        self.user = User(
            username=f'test_{timestamp}',
            email=f'test_{timestamp}@example.com'
        )
        self.user.set_password('test')
        # Set user as admin and grant mixer access
        self.user.is_admin = True
        self.user.is_active = True
        self.user.can_access_mixer = True
        db.session.add(self.user)
        db.session.commit()

        # Copy test audio files if available
        test_audio = os.path.join(os.path.dirname(__file__), 'uploads')
        if os.path.exists(test_audio):
            for file in os.listdir(test_audio):
                if file.endswith(('.mp3', '.wav', '.ogg', '.m4a')):
                    shutil.copy(
                        os.path.join(test_audio, file),
                        os.path.join(self.uploads_dir, file)
                    )

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.req_ctx.pop()
        self.ctx.pop()
        shutil.rmtree(self.test_dir)

    def login(self):
        return self.client.post('/login', data={
            'username': self.user.username,
            'password': 'test'
        }, follow_redirects=True)

    def test_login_logout(self):
        """Test user authentication"""
        # Test login
        response = self.login()
        self.assertIn(b'Mixer', response.data)  # Changed from 'DJ Mixer' to 'Mixer'

        # Test logout
        response = self.client.get('/logout', follow_redirects=True)
        self.assertIn(b'Connexion', response.data)  # Changed to match French UI

    def test_playlist_creation(self):
        """Test automatic playlist creation from folders"""
        self.login()

        # Create test playlist structure
        playlist_dir = os.path.join(self.uploads_dir, 'Test Playlist')
        os.makedirs(playlist_dir)

        # Copy test files if available
        has_test_files = False
        for file in os.listdir(self.uploads_dir):
            if file.endswith(('.mp3', '.wav', '.ogg', '.m4a')):
                shutil.copy(
                    os.path.join(self.uploads_dir, file),
                    os.path.join(playlist_dir, file)
                )
                has_test_files = True

        if not has_test_files:
            self.skipTest("No test audio files available")

        # Scan music folders
        response = self.client.get('/api/scan-music')
        self.assertEqual(response.status_code, 200)

        # Wait for scan to complete
        self.wait_for_scan_completion()

        # Check playlist creation with context
        with self.app.app_context():

            # Check playlist creation
            playlist = Playlist.query.filter_by(
                name='Test Playlist',
                user_id=self.user.id
            ).first()

            self.assertIsNotNone(playlist)
            self.assertTrue(len(playlist.tracks) > 0)

    def test_api_endpoints(self):
        """Test API endpoints"""
        # Login and store the session
        with self.client:
            response = self.login()
            self.assertIn(b'Mixer', response.data)  # Ensure we're logged in

        # Test playlist endpoint
        response = self.client.get('/api/playlists')
        self.assertEqual(response.status_code, 200)
        playlists = response.get_json()
        self.assertIsInstance(playlists, list)

        # Test tracks endpoint
        response = self.client.get('/api/tracks')
        self.assertEqual(response.status_code, 200)
        tracks = response.get_json()
        self.assertIsInstance(tracks, list)

        # Test scan endpoint
        response = self.client.get('/api/scan-music')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('message', data)

    def test_file_upload(self):
        """Test file upload functionality"""
        self.login()

        test_files = [f for f in os.listdir(self.uploads_dir)
                     if f.endswith(('.mp3', '.wav', '.ogg', '.m4a'))]

        if not test_files:
            self.skipTest("No test audio files available")

        for filename in test_files:
            filepath = os.path.join(self.uploads_dir, filename)

            with open(filepath, 'rb') as f:
                response = self.client.post('/api/tracks', data={
                    'file': (f, filename)
                })

            self.assertEqual(response.status_code, 200)
            data = response.get_json()

            # Verify track creation with context
            with self.app.app_context():
                track = Track.query.get(data['id'])
                self.assertIsNotNone(track)
                self.assertEqual(track.user_id, self.user.id)
                self.assertTrue(os.path.exists(track.file_path))

    def wait_for_scan_completion(self, timeout=5):
        """Wait for background scan to complete"""
        threads = threading.enumerate()
        scan_threads = [t for t in threads if t.name.startswith('scan_')]

        for thread in scan_threads:
            thread.join(timeout)

def run_tests():
    print("Running system tests...")
    unittest.main(verbosity=2)

if __name__ == '__main__':
    run_tests()
