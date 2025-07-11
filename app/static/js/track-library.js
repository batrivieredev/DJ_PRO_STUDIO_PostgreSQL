class TrackLibrary {
    constructor() {
        this.playlists = [];
        this.tracks = [];
        this.currentPlaylist = null;
        this.lastLoadedPlaylist = null;
        this.loadPlaylistDebounceTimer = null;
        this.cachedPlaylistTracks = new Map();

        // DOM Elements
        this.playlistsList = document.getElementById('playlistsList');
        this.tracksList = document.getElementById('tracksList');
        this.searchInput = document.getElementById('searchTracks');
        this.refreshButton = document.getElementById('refreshLibrary');
        this.analyzeButton = document.getElementById('analyzeTracks');
        this.uploadForm = document.getElementById('uploadForm');
        this.uploadButton = document.getElementById('startUpload');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.libraryPanel = document.querySelector('.library-panel');
        this.libraryToggle = document.querySelector('.library-toggle');

        // Event Listeners
        this.attachEventListeners();
        this.loadLibrary();
    }

    attachEventListeners() {
        // Toggle du panneau de bibliothèque
        this.libraryToggle.addEventListener('click', () => this.toggleLibrary());

        // Recherche
        this.searchInput.addEventListener('input', () => this.filterTracks());

        // Rafraîchir la bibliothèque
        this.refreshButton.addEventListener('click', () => this.loadLibrary());

        // Analyser les BPM
        this.analyzeButton.addEventListener('click', () => this.analyzeTracks());

        // Upload de fichiers
        this.uploadButton.addEventListener('click', () => this.uploadFiles());

        // Création de playlist
        document.getElementById('createPlaylist').addEventListener('click', () => this.createPlaylist());
    }

    async loadLibrary() {
        try {
            // Load playlists and tracks in parallel
            const [playlistsResponse, tracksResponse] = await Promise.all([
                fetch('/api/playlists'),
                fetch('/api/tracks')
            ]);

            this.playlists = await playlistsResponse.json();
            this.tracks = await tracksResponse.json();

            // Preload playlist tracks in the background
            this.playlists.forEach(playlist => {
                this.preloadPlaylistTracks(playlist.id);
            });

            this.renderPlaylists();
            this.renderTracks();

        } catch (error) {
            console.error('Erreur lors du chargement de la bibliothèque:', error);
            this.showError('Erreur lors du chargement de la bibliothèque');
        }
    }

    async preloadPlaylistTracks(playlistId) {
        try {
            // Only preload if not already cached
            if (!this.cachedPlaylistTracks.has(playlistId)) {
                const response = await fetch(`/api/playlists/${playlistId}/tracks`);
                const tracks = await response.json();
                this.cachedPlaylistTracks.set(playlistId, tracks);
            }
        } catch (error) {
            console.error(`Error preloading playlist ${playlistId}:`, error);
        }
    }

    renderPlaylists() {
        this.playlistsList.innerHTML = '';

        this.playlists.forEach(playlist => {
            const item = document.createElement('div');
            item.className = 'playlist-item d-flex align-items-center p-2 border-bottom border-secondary';
            item.innerHTML = `
                <span class="material-icons me-2">playlist_play</span>
                <div class="flex-grow-1 text-truncate">${playlist.name}</div>
                <small class="text-muted">${playlist.trackCount}</small>
            `;

            item.addEventListener('click', () => {
                // Remove hidden class from tracks tab
                document.getElementById('tracksTab').classList.remove('hidden');
                this.loadPlaylist(playlist.id);
            });
            this.playlistsList.appendChild(item);
        });
    }

    renderTracks(tracks = this.tracks) {
        this.tracksList.innerHTML = `
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>Charger</th>
                        <th>Titre</th>
                        <th>Artiste</th>
                        <th>BPM</th>
                        <th>Tonalité</th>
                        <th>Durée</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;

        const tbody = this.tracksList.querySelector('tbody');
        const isLayoutFourDecks = document.querySelector('.decks-container').classList.contains('layout-4-decks');

        tracks.forEach(track => {
            const row = document.createElement('tr');
            const loadButtons = isLayoutFourDecks ? `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary load-deck" data-deck="A">A</button>
                    <button class="btn btn-outline-primary load-deck" data-deck="B">B</button>
                    <button class="btn btn-outline-primary load-deck" data-deck="C">C</button>
                    <button class="btn btn-outline-primary load-deck" data-deck="D">D</button>
                </div>
            ` : `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary load-deck" data-deck="A">A</button>
                    <button class="btn btn-outline-primary load-deck" data-deck="B">B</button>
                </div>
            `;

            row.innerHTML = `
                <td>${loadButtons}</td>
                <td class="text-truncate">${track.title || 'Sans titre'}</td>
                <td class="text-truncate">${track.artist || 'Inconnu'}</td>
                <td>${track.bpm || '---'}</td>
                <td>${track.key || '---'}</td>
                <td>${this.formatDuration(track.duration)}</td>
            `;

            // Event listeners pour le chargement dans les decks
            row.querySelectorAll('.load-deck').forEach(button => {
                button.addEventListener('click', () => {
                    const deckId = button.dataset.deck;
                    document.dispatchEvent(new CustomEvent('loadTrack', {
                        detail: { track, deckId }
                    }));
                });
            });

            row.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(track));
            });

            row.draggable = true;
            tbody.appendChild(row);
        });
    }

    async loadPlaylist(playlistId) {
        try {
            // Check cache first
            if (this.cachedPlaylistTracks.has(playlistId)) {
                const tracks = this.cachedPlaylistTracks.get(playlistId);
                this.currentPlaylist = playlistId;
                this.renderTracks(tracks);
                return;
            }

            // If not in cache, load immediately and cache
            const response = await fetch(`/api/playlists/${playlistId}/tracks`);
            const tracks = await response.json();
            this.cachedPlaylistTracks.set(playlistId, tracks);
            this.currentPlaylist = playlistId;
            this.renderTracks(tracks);

        } catch (error) {
            console.error('Erreur lors du chargement de la playlist:', error);
            this.showError('Erreur lors du chargement de la playlist');
        }
    }

    filterTracks() {
        const query = this.searchInput.value.toLowerCase();
        const filteredTracks = this.tracks.filter(track =>
            track.title.toLowerCase().includes(query) ||
            track.artist.toLowerCase().includes(query)
        );
        this.renderTracks(filteredTracks);
    }

    async createPlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const description = document.getElementById('playlistDescription').value.trim();

        if (!name) {
            this.showError('Le nom de la playlist est requis');
            return;
        }

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) throw new Error('Erreur lors de la création');

            bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
            await this.loadLibrary();
            this.showSuccess('Playlist créée avec succès');

        } catch (error) {
            console.error('Erreur lors de la création de la playlist:', error);
            this.showError('Erreur lors de la création de la playlist');
        }
    }

    async uploadFiles() {
        const files = document.getElementById('musicFiles').files;
        if (!files.length) {
            this.showError('Veuillez sélectionner des fichiers');
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append('file', file);
        }

        this.uploadProgress.classList.remove('d-none');
        this.uploadButton.disabled = true;

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);

                const response = await fetch('/api/tracks', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Erreur lors de l\'upload');

                const progress = ((i + 1) / files.length) * 100;
                this.uploadProgress.querySelector('.progress-bar').style.width = `${progress}%`;
            }

            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            await this.loadLibrary();
            this.showSuccess('Upload terminé avec succès');

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            this.showError('Erreur lors de l\'upload des fichiers');
        } finally {
            this.uploadProgress.classList.add('d-none');
            this.uploadButton.disabled = false;
            this.uploadForm.reset();
        }
    }

    async analyzeTracks() {
        const selectedTracks = Array.from(this.tracksList.querySelectorAll('tr'))
            .filter(row => row.querySelector('input[type="checkbox"]:checked'))
            .map(row => parseInt(row.dataset.trackId));

        if (!selectedTracks.length) {
            this.showError('Veuillez sélectionner des morceaux à analyser');
            return;
        }

        this.analyzeButton.disabled = true;

        try {
            for (let trackId of selectedTracks) {
                await fetch(`/api/tracks/${trackId}/analyze-bpm`, { method: 'POST' });
            }

            await this.loadLibrary();
            this.showSuccess('Analyse BPM terminée');

        } catch (error) {
            console.error('Erreur lors de l\'analyse BPM:', error);
            this.showError('Erreur lors de l\'analyse BPM');
        } finally {
            this.analyzeButton.disabled = false;
        }
    }

    formatDuration(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showSuccess(message) {
        // TODO: Implémenter un système de notifications
        console.log('✅', message);
    }

    showError(message) {
        // TODO: Implémenter un système de notifications
        console.error('❌', message);
    }
    toggleLibrary() {
        this.libraryPanel.classList.toggle('hidden');
        const icon = this.libraryToggle.querySelector('.material-icons');
        if (this.libraryPanel.classList.contains('hidden')) {
            icon.textContent = 'library_music';
            this.libraryToggle.setAttribute('title', 'Afficher la bibliothèque');
        } else {
            icon.textContent = 'close';
            this.libraryToggle.setAttribute('title', 'Masquer la bibliothèque');
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.trackLibrary = new TrackLibrary();
});
