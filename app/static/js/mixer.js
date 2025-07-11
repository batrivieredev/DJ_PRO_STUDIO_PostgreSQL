document.addEventListener('DOMContentLoaded', function() {
    // Contexte audio pour la gestion du son
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let analyserNodes = new Map();

    // Variables d'état
    let currentPlaylist = null; // Playlist actuellement sélectionnée
    let decksCount = 2; // Nombre de decks affichés (2 ou 4)

    // Classe Deck : gère un platine virtuel avec ses contrôles et sa visualisation
    class Deck {
        constructor(id) {
            this.id = id;
            this.audio = new Audio();
            this.isPlaying = false;
            this.gainNode = audioContext.createGain();
            this.analyserNode = audioContext.createAnalyser();
            this.gainNode.connect(this.analyserNode);
            this.analyserNode.connect(audioContext.destination);
            this.source = null;
            this.currentTrackId = null;

            // Configuration de l'analyseur audio pour la visualisation
            this.analyserNode.fftSize = 2048;
            this.bufferLength = this.analyserNode.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            // Éléments DOM du deck
            this.element = document.getElementById(`deck-${id}`);
            if (!this.element) return;

            this.setupControls();
            this.setupAudio();
            this.setupWaveform();
            this.setupDragAndDrop();
        }

        // Configuration des contrôles (boutons et sliders)
        setupControls() {
            const controls = this.element.querySelector('.controls');
            const [playBtn, pauseBtn, cueBtn, loopBtn] = controls.querySelectorAll('button');
            const volumeSlider = document.getElementById(`volume-${this.id}`);
            const pitchSlider = document.getElementById(`pitch-${this.id}`);

            playBtn.onclick = () => this.play();
            pauseBtn.onclick = () => this.pause();
            cueBtn.onclick = () => this.cue();
            loopBtn.onclick = () => this.toggleLoop();

            if (volumeSlider) {
                volumeSlider.oninput = (e) => {
                    if (this.gainNode) {
                        this.gainNode.gain.value = e.target.value / 100;
                    }
                };
            }

            if (pitchSlider) {
                pitchSlider.oninput = (e) => {
                    const value = 1 + (parseFloat(e.target.value) / 100);
                    this.audio.playbackRate = value;
                };
            }
        }

        // Configuration des événements audio
        setupAudio() {
            this.audio.onended = () => {
                this.isPlaying = false;
                this.updateButtons();
            };

            this.audio.ontimeupdate = () => {
                this.updateProgress();
            };
        }

        // Création et configuration de la visualisation waveform
        setupWaveform() {
            const waveformContainer = document.createElement('div');
            waveformContainer.className = 'waveform-container';

            const waveform = document.createElement('canvas');
            waveform.className = 'waveform';
            waveformContainer.appendChild(waveform);

            const progress = document.createElement('div');
            progress.className = 'waveform-progress';
            waveformContainer.appendChild(progress);

            // Insert after controls
            const controls = this.element.querySelector('.controls');
            controls.parentNode.insertBefore(waveformContainer, controls.nextSibling);

            this.waveform = waveform;
            this.waveformProgress = progress;
            this.waveformCtx = waveform.getContext('2d');

            // Click handling for seeking
            waveformContainer.onclick = (e) => {
                const rect = waveformContainer.getBoundingClientRect();
                const clickPosition = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = this.audio.duration * clickPosition;
            };

            // Start animation
            this.drawWaveform();
        }

        // Configuration du drag & drop pour charger des morceaux
        setupDragAndDrop() {
            this.element.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.element.classList.add('drag-over');
            });

            this.element.addEventListener('dragleave', () => {
                this.element.classList.remove('drag-over');
            });

            this.element.addEventListener('drop', (e) => {
                e.preventDefault();
                this.element.classList.remove('drag-over');
                const trackId = e.dataTransfer.getData('text/plain');
                if (trackId) {
                    this.loadTrack(trackId);
                }
            });
        }

        // Dessine la visualisation des fréquences en temps réel
        drawWaveform() {
            requestAnimationFrame(() => this.drawWaveform());

            const canvas = this.waveform;
            const ctx = this.waveformCtx;
            const width = canvas.width;
            const height = canvas.height;

            // Ensure canvas size matches container
            const container = canvas.parentElement;
            if (canvas.width !== container.clientWidth) {
                canvas.width = container.clientWidth;
            }
            if (canvas.height !== container.clientHeight) {
                canvas.height = container.clientHeight;
            }

            // Get frequency data
            this.analyserNode.getByteFrequencyData(this.dataArray);

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw frequency bars
            const barWidth = width / this.bufferLength;
            let x = 0;

            for(let i = 0; i < this.bufferLength; i++) {
                const barHeight = (this.dataArray[i] / 255) * height;

                // Color gradient based on frequency
                const hue = i / this.bufferLength * 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth;
            }
        }

        // Met à jour la barre de progression de lecture
        updateProgress() {
            if (this.audio.duration) {
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                this.waveformProgress.style.width = `${progress}%`;
            }
        }

        // Charge un morceau depuis l'API et configure l'audio
        async loadTrack(trackId) {
            const isFromMixerPage = window.location.pathname === '/choose' ||
                                  (window.location.pathname === '/mixer' && document.querySelector('.navbar button:last-child').contains(event.target));

            if (isFromMixerPage) {
                window.location.href = '/loading';
                return;
            }
            // Stop other decks if they're playing this track
            for (let deckId in decks) {
                if (decks[deckId].currentTrackId === trackId && decks[deckId].isPlaying) {
                    decks[deckId].pause();
                }
            }

            try {
                const response = await fetch(`/api/tracks/${trackId}/file`);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                // Clean up old URL if exists
                if (this.audio.src) {
                    URL.revokeObjectURL(this.audio.src);
                }

                this.audio.src = url;
                this.currentTrackId = trackId;

                // Reset audio nodes
                if (this.source) {
                    this.source.disconnect();
                }
                this.source = audioContext.createMediaElementSource(this.audio);
                this.source.connect(this.gainNode);

                // Get track info
                const trackInfo = await fetch(`/api/tracks/${trackId}`).then(r => r.json());
                this.updateTrackInfo(trackInfo);

            } catch (error) {
                console.error('Error loading track:', error);
            }
        }

        // Met à jour les informations affichées du morceau
        updateTrackInfo(track) {
            const titleEl = this.element.querySelector('.track-name');
            const bpmEl = this.element.querySelector('.bpm-display');

            if (titleEl) titleEl.textContent = track.title || 'Pas de morceau';
            if (bpmEl) bpmEl.textContent = track.bpm ? `${track.bpm} BPM` : '--- BPM';
        }

        // Met à jour l'état des boutons de contrôle
        updateButtons() {
            const [playBtn, pauseBtn] = this.element.querySelectorAll('.controls button');
            playBtn.disabled = this.isPlaying;
            pauseBtn.disabled = !this.isPlaying;
        }

        // Démarre la lecture du morceau
        async play() {
            if (!this.audio.src) return;
            try {
                await audioContext.resume();
                await this.audio.play();
                this.isPlaying = true;
                this.updateButtons();
            } catch (error) {
                console.error('Error playing:', error);
            }
        }

        pause() {
            this.audio.pause();
            this.isPlaying = false;
            this.updateButtons();
        }

        cue() {
            this.audio.currentTime = 0;
        }

        toggleLoop() {
            this.audio.loop = !this.audio.loop;
            this.element.querySelector('.controls button:last-child').classList.toggle('active');
        }
    }

    // Initialisation des 4 platines virtuelles
    const decks = {
        a: new Deck('a'),
        b: new Deck('b'),
        c: new Deck('c'),
        d: new Deck('d')
    };

    // Initialisation du panneau des playlists
    function initializePlaylists() {
        const playlistsList = document.querySelector('.playlists-panel');
        if (playlistsList) {
            // Ajouter le bouton "Bibliothèque complète"
            const allTracksBtn = document.createElement('div');
            allTracksBtn.className = 'playlist-item active';
            allTracksBtn.innerHTML = `
                <span class="material-icons">library_music</span>
                Bibliothèque complète
            `;
            allTracksBtn.onclick = () => {
                loadTracks();
                document.querySelectorAll('.playlist-item').forEach(item =>
                    item.classList.remove('active'));
                allTracksBtn.classList.add('active');
                currentPlaylist = null;
            };
            playlistsList.insertBefore(allTracksBtn, playlistsList.firstChild);

            // Afficher les playlists initiales
            loadPlaylists();
        }
    }

    // Chargement et affichage des playlists depuis le serveur
    async function loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            const playlists = await response.json();
            const playlistsList = document.querySelector('.playlists-panel');

            if (playlistsList) {
                // Conserver le bouton "Bibliothèque complète"
                const allTracksBtn = playlistsList.firstChild;

                // Créer un élément select pour les playlists
                const select = document.createElement('select');
                select.className = 'form-select mt-3';
                select.innerHTML = `
                    <option value="">Sélectionner une playlist</option>
                    ${playlists.map(playlist => `
                        <option value="${playlist.id}">${playlist.name}</option>
                    `).join('')}
                `;

                // Gestionnaire de changement pour le select
                select.onchange = (e) => {
                    const playlistId = e.target.value;
                    if (playlistId) {
                        loadPlaylistTracks(playlistId);
                    } else {
                        loadTracks();
                    }
                };

                // Mettre à jour le contenu en préservant le bouton
                if (allTracksBtn) {
                    playlistsList.innerHTML = '';
                    playlistsList.appendChild(allTracksBtn);
                    playlistsList.appendChild(select);
                } else {
                    playlistsList.innerHTML = '';
                    playlistsList.appendChild(select);
                }
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    }

    // Charge et affiche les morceaux d'une playlist
    async function loadPlaylistTracks(playlistId) {
        // Stocke la playlist active
        currentPlaylist = playlistId;
        try {
            const response = await fetch(`/api/playlists/${playlistId}/tracks`);
            const tracks = await response.json();
            const tracksList = document.getElementById('tracksList');

            if (tracksList) {
                // Clear the tracks list
                tracksList.innerHTML = '';

                // Filter tracks based on search input
                const searchInput = document.getElementById('searchInput');
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                const filteredTracks = tracks.filter(track =>
                    (track.title || '').toLowerCase().includes(searchTerm) ||
                    (track.artist || '').toLowerCase().includes(searchTerm)
                );

                // Add filtered tracks to the table
                tracks.forEach(track => {
                    const tr = document.createElement('tr');
                    tr.className = 'track-row';
                    tr.draggable = true;
                    tr.dataset.trackId = track.id;
                    tr.innerHTML = `
                        <td>${track.title || 'Titre inconnu'}</td>
                        <td>${track.artist || 'Artiste inconnu'}</td>
                        <td>${track.bpm ? `${track.bpm} BPM` : '---'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-secondary" onclick="analyzeBPM(${track.id})">
                                <span class="material-icons">speed</span>
                            </button>
                        </td>
                    `;
                    tracksList.appendChild(tr);
                });

                // Ajouter les gestionnaires de drag & drop
                tracksList.querySelectorAll('tr[data-track-id]').forEach(row => {
                    row.ondragstart = (e) => {
                        e.dataTransfer.setData('text/plain', row.dataset.trackId);
                    };

                    row.onclick = () => {
                        const trackId = row.dataset.trackId;
                        const activeDeck = document.querySelector('.library-controls button.active');
                        if (activeDeck) {
                            const deckId = activeDeck.dataset.deck.toLowerCase();
                            decks[deckId]?.loadTrack(trackId);
                        }
                    };
                });
            }
        } catch (error) {
            console.error('Error loading playlist tracks:', error);
        }
    }

    // Charge tous les morceaux de la bibliothèque
    async function loadTracks() {
        try {
            const response = await fetch('/api/tracks');
            const tracks = await response.json();
            const tracksList = document.getElementById('tracksList');

            if (tracksList) {
                // Clear the tracks list
                tracksList.innerHTML = '';

                // Filter tracks based on search input
                const searchInput = document.getElementById('searchInput');
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                const filteredTracks = tracks.filter(track =>
                    (track.title || '').toLowerCase().includes(searchTerm) ||
                    (track.artist || '').toLowerCase().includes(searchTerm)
                );

                // Add filtered tracks to the table
                tracks.forEach(track => {
                    const tr = document.createElement('tr');
                    tr.className = 'track-row';
                    tr.draggable = true;
                    tr.dataset.trackId = track.id;
                    tr.innerHTML = `
                        <td>${track.title || 'Titre inconnu'}</td>
                        <td>${track.artist || 'Artiste inconnu'}</td>
                        <td>${track.bpm ? `${track.bpm} BPM` : '---'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-secondary" onclick="analyzeBPM(${track.id})">
                                <span class="material-icons">speed</span>
                            </button>
                        </td>
                    `;
                    tracksList.appendChild(tr);
                });

                // Add drag handlers
                tracksList.querySelectorAll('tr[data-track-id]').forEach(row => {
                    row.ondragstart = (e) => {
                        e.dataTransfer.setData('text/plain', row.dataset.trackId);
                    };

                    row.onclick = () => {
                        const trackId = row.dataset.trackId;
                        const activeDeck = document.querySelector('.library-controls button.active');
                        if (activeDeck) {
                            const deckId = activeDeck.dataset.deck.toLowerCase();
                            decks[deckId]?.loadTrack(trackId);
                        }
                    };
                });
            }
        } catch (error) {
            console.error('Error loading tracks:', error);
        }
    }

    // Ajouter un gestionnaire d'événements pour rediriger depuis la page de chargement
    if (window.location.pathname === '/loading') {
        setTimeout(() => {
            window.location.href = '/mixer';
        }, 5000);
    }

    // Initialize search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (currentPlaylist) {
                loadPlaylistTracks(currentPlaylist);
            } else {
                loadTracks();
            }
        });
    }

    // Initialize interface
    initializePlaylists();

    // Fonction pour attacher les gestionnaires d'événements aux boutons de sélection des decks
    function attachDeckSelectorHandlers() {
        document.querySelectorAll('.library-controls button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.library-controls button').forEach(b =>
                    b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
    }

    // Gestion du switch entre 2 et 4 decks
    const layout2DecksBtn = document.getElementById('layout2Decks');
    const layout4DecksBtn = document.getElementById('layout4Decks');
    const decksContainer = document.querySelector('.row.g-3');

    if (layout2DecksBtn && layout4DecksBtn && decksContainer) {
        // Cache les decks C et D au démarrage
        document.querySelectorAll('#deck-c, #deck-d').forEach(deck =>
            deck.style.display = 'none');

        // Fonction pour mettre à jour les boutons de sélection des decks
        function updateDeckSelectors(mode) {
            const controls = document.querySelector('.library-controls');
            if (mode === 2) {
                controls.innerHTML = `
                    <button class="btn btn-outline-primary active" data-deck="A">Deck A</button>
                    <button class="btn btn-outline-danger" data-deck="B">Deck B</button>
                `;
            } else {
                controls.innerHTML = `
                    <button class="btn btn-outline-primary active" data-deck="A">Deck A</button>
                    <button class="btn btn-outline-danger" data-deck="B">Deck B</button>
                    <button class="btn btn-outline-warning" data-deck="C">Deck C</button>
                    <button class="btn btn-outline-info" data-deck="D">Deck D</button>
                `;
            }
            // Réattacher les gestionnaires d'événements aux boutons
            attachDeckSelectorHandlers();
        }

        layout2DecksBtn.onclick = () => {
            decksCount = 2;
            const decksContainer = document.querySelector('.row.g-3');
            decksContainer.classList.remove('four-decks');
            decksContainer.classList.add('two-decks');
            document.querySelectorAll('#deck-c, #deck-d').forEach(deck =>
                deck.style.display = 'none');
            layout2DecksBtn.classList.add('active');
            layout4DecksBtn.classList.remove('active');
            updateDeckSelectors(2);
            layout2DecksBtn.classList.add('active');
            layout4DecksBtn.classList.remove('active');
        };

        layout4DecksBtn.onclick = () => {
            decksCount = 4;
            const decksContainer = document.querySelector('.row.g-3');
            decksContainer.classList.remove('two-decks');
            decksContainer.classList.add('four-decks');
            document.querySelectorAll('#deck-c, #deck-d').forEach(deck =>
                deck.style.display = 'block');
            layout4DecksBtn.classList.add('active');
            layout2DecksBtn.classList.remove('active');
            updateDeckSelectors(4);
            layout4DecksBtn.classList.add('active');
            layout2DecksBtn.classList.remove('active');
        };
    }

    // Gestion du toggle du panneau des playlists
    const togglePlaylistsBtn = document.getElementById('togglePlaylists');
    const playlistsPanel = document.querySelector('.playlists-panel');

    if (togglePlaylistsBtn && playlistsPanel) {
        togglePlaylistsBtn.onclick = () => {
            playlistsPanel.classList.toggle('active');
            togglePlaylistsBtn.classList.toggle('active');
        };
    }

    // Gestion de la sélection du deck actif
    document.querySelectorAll('.library-controls button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.library-controls button').forEach(b =>
                b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // Configuration du crossfader entre les decks
    const crossfader = document.querySelector('.crossfader');
    if (crossfader) {
        crossfader.oninput = (e) => {
            const value = parseInt(e.target.value);
            const gainA = Math.cos((value + 100) * (Math.PI / 400));
            const gainB = Math.cos((100 - value) * (Math.PI / 400));

            if (decks.a?.gainNode) decks.a.gainNode.gain.value = gainA;
            if (decks.b?.gainNode) decks.b.gainNode.gain.value = gainB;
        };
    }

    // Gestion de l'upload de fichiers audio
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    if (uploadZone && fileInput) {
        uploadZone.ondragover = (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        };

        uploadZone.ondragleave = () => {
            uploadZone.classList.remove('dragover');
        };

        uploadZone.ondrop = (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        };

        uploadZone.onclick = () => fileInput.click();
        fileInput.onchange = () => handleFiles(fileInput.files);
    }

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            const formData = new FormData();
            formData.append('file', file);

            fetch('/api/tracks', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Upload successful:', data);
                if (currentPlaylist) {
                    loadPlaylistTracks(currentPlaylist);
                } else {
                    loadTracks();
                }
            })
            .catch(error => console.error('Upload error:', error));
        });
    }

    // Scanner la bibliothèque musicale
    window.scanLibrary = async function() {
        try {
            document.body.style.cursor = 'wait';
            const response = await fetch('/api/scan-music');
            const data = await response.json();
            console.log('Scan started:', data);

            let attempts = 0;
            const maxAttempts = 5;
            const checkInterval = setInterval(async () => {
                if (currentPlaylist) {
                    await loadPlaylistTracks(currentPlaylist);
                } else {
                    await loadTracks();
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    document.body.style.cursor = 'default';
                }
            }, 2000);
        } catch (error) {
            console.error('Scan error:', error);
            document.body.style.cursor = 'default';
        }
    };

    // Analyse du BPM des morceaux
    window.analyzeBPM = async function(trackId) {
        try {
            const btn = document.querySelector(`tr[data-track-id="${trackId}"] button`);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-icons spin">refresh</span>';
            }

            const response = await fetch(`/api/tracks/${trackId}/analyze-bpm`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.bpm) {
                console.log('BPM detected:', data.bpm);
                if (currentPlaylist) {
                    loadPlaylistTracks(currentPlaylist);
                } else {
                    loadTracks();
                }
            } else {
                console.error('BPM detection failed');
                if (btn) {
                    btn.innerHTML = '<span class="material-icons">error</span>';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.innerHTML = '<span class="material-icons">speed</span>';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('BPM analysis error:', error);
            const btn = document.querySelector(`tr[data-track-id="${trackId}"] button`);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-icons">speed</span>';
            }
        }
    };
});
