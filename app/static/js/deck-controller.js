class DeckController {
    constructor(deckId) {
        this.deckId = deckId;
        this.isPlaying = false;
        this.currentTrack = null;
        this.position = 0;

        // Initialize DOM elements with validation
        this.initializeDOMElements(deckId);

        // Initial values
        this.volume = 1.0;
        this.speed = 1.0;

        // Initialize audio engine and event listeners if DOM elements are available
        if (this.validateDOMElements()) {
            this.audioEngine = new AudioEngine(deckId);
            this.attachEventListeners();
            this.setupDragAndDrop();
            console.log(`✅ Deck ${deckId} initialized successfully`);
        } else {
            throw new Error(`❌ Failed to initialize deck ${deckId}: Missing DOM elements`);
        }
    }

    // Initialize DOM elements
    initializeDOMElements(deckId) {
        // Main elements
        this.waveform = document.getElementById(`waveform${deckId}`);
        this.playButton = document.getElementById(`play${deckId}`);
        this.cueButton = document.getElementById(`cue${deckId}`);
        this.loadButton = document.getElementById(`loadDeck${deckId}`);
        this.ejectButton = document.getElementById(`ejectDeck${deckId}`);
        this.volumeSlider = document.getElementById(`volume${deckId}`);
        this.volumeMeter = document.getElementById(`volumeMeter${deckId}`);
        this.speedSlider = document.getElementById(`speed${deckId}`);
        this.speedValue = document.getElementById(`speedValue${deckId}`);

        // Info elements (only if waveform element exists)
        if (this.waveform) {
            const deckElement = this.waveform.closest('.deck');
            if (deckElement) {
                this.titleElement = deckElement.querySelector('.track-title');
                this.artistElement = deckElement.querySelector('.track-artist');
                this.bpmElement = deckElement.querySelector('.bpm');
                this.timeElement = deckElement.querySelector('.time');
            }
        }
    }

    // Validate required DOM elements
    validateDOMElements() {
        const required = [
            'waveform',
            'playButton',
            'cueButton',
            'volumeSlider',
            'volumeMeter'
        ];

        return required.every(elem => {
            const hasElement = !!this[elem];
            if (!hasElement) {
                console.error(`Missing required element: ${elem}`);
            }
            return hasElement;
        });
    }

    attachEventListeners() {
        // Contrôles de lecture
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.cueButton.addEventListener('mousedown', () => this.pressCue());
        this.cueButton.addEventListener('mouseup', () => this.releaseCue());

        // Track seeking dans la waveform
        this.waveform.addEventListener('click', (e) => {
            if (!this.currentTrack) return;

            const rect = this.waveform.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const duration = this.audioEngine.getDuration();
            const seekTime = duration * percentage;

            this.audioEngine.seekTo(seekTime);
        });

        // Contrôles de chargement
        this.loadButton.addEventListener('click', () => this.openTrackSelector());
        this.ejectButton.addEventListener('click', () => this.ejectTrack());

        // Contrôles de volume et vitesse
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.audioEngine.setVolume(this.volume);
            this.updateVolumeMeter();
        });

        this.speedSlider.addEventListener('input', (e) => {
            this.speed = e.target.value / 100;
            this.audioEngine.setPlaybackRate(this.speed);
            this.speedValue.textContent = `${e.target.value}%`;
        });

        // Mise à jour du VU-mètre
        setInterval(() => this.updateVolumeMeter(), 50);

        // Mise à jour de la position et du VU-mètre
        // High precision playback position tracking
        let lastTimestamp = 0;
        const updatePlaybackPosition = (timestamp) => {
            if (this.isPlaying) {
                // Smooth animation even at high refresh rates
                if (timestamp - lastTimestamp > 16) { // ~60fps
                    const currentTime = this.audioEngine.getCurrentTime();
                    this.position = currentTime;
                    this.updateTimeDisplay(currentTime, this.audioEngine.getDuration());
                    this.updateProgress(currentTime);
                    lastTimestamp = timestamp;
                }
                requestAnimationFrame(updatePlaybackPosition);
            }
        };

        // Continuous progress update for smoother cursor movement
        const updateProgress = () => {
            if (this.isPlaying) {
                const currentTime = this.audioEngine.getCurrentTime();
                this.updateTimeDisplay(currentTime, this.audioEngine.getDuration());
                this.updateProgress(currentTime);
                requestAnimationFrame(updateProgress);
            }
        };

        this.audioEngine.onTimeUpdate((currentTime, duration) => {
            this.position = currentTime;
            this.updateTimeDisplay(currentTime, duration);
            if (!this.isPlaying) {
                this.updateProgress(currentTime);
            }
        });

        this.audioEngine.onPlay(() => {
            this.isPlaying = true;
            requestAnimationFrame(updateProgress);
        });

        this.audioEngine.onPlay(() => {
            this.isPlaying = true;
            requestAnimationFrame(updatePlaybackPosition);
        });

        this.audioEngine.onVUMeter((level) => {
            const meterHeight = Math.min(100, level);
            if (this.volumeMeter) {
                this.volumeMeter.style.height = `${meterHeight}%`;

                // Change la couleur en fonction du niveau
                if (meterHeight > 80) {
                    this.volumeMeter.style.backgroundColor = '#ff0000'; // Rouge pour niveau élevé
                } else if (meterHeight > 60) {
                    this.volumeMeter.style.backgroundColor = '#ffff00'; // Jaune pour niveau moyen
                } else {
                    this.volumeMeter.style.backgroundColor = '#00ff00'; // Vert pour niveau bas
                }
            }
        });

        // État de lecture
        this.audioEngine.onPlay(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.startFrequencyAnimation();
        });

        this.audioEngine.onPause(() => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        // Écoute des événements de chargement de morceaux
        document.addEventListener('loadTrack', (e) => {
            if (this.isSelected()) {
                this.loadTrack(e.detail);
            }
        });
    }

    setupDragAndDrop() {
        const deckElement = this.waveform.closest('.deck');

        // Ajout de la classe pour le mode 4 decks
        if (document.querySelector('.layout-4decks')) {
            deckElement.classList.add('deck-4mode');
        }

        this.waveform.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.waveform.classList.add('drag-over');
        });

        this.waveform.addEventListener('dragleave', () => {
            this.waveform.classList.remove('drag-over');
        });

        this.waveform.addEventListener('drop', (e) => {
            e.preventDefault();
            this.waveform.classList.remove('drag-over');

            try {
                const track = JSON.parse(e.dataTransfer.getData('application/json'));
                this.loadTrack(track);
            } catch (error) {
                console.error('Invalid track data:', error);
            }
        });
    }

    isSelected() {
        // Vérifie si ce deck est sélectionné pour le chargement
        return !document.querySelector('.deck.selected') ||
               this.waveform.closest('.deck').classList.contains('selected');
    }

    async loadTrack(track) {
        try {
            // Récupère le fichier audio
            const response = await fetch(`/api/tracks/${track.id}/file`);
            if (!response.ok) throw new Error('Erreur lors du chargement du fichier');

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            // Charge le morceau dans le moteur audio
            await this.audioEngine.loadTrack(audioUrl);

            // Met à jour l'interface
            this.currentTrack = track;
            this.titleElement.textContent = track.title;
            this.artistElement.textContent = track.artist;

            // Analyse le BPM si non défini
            if (!track.bpm) {
                try {
                    const response = await fetch(`/api/tracks/${track.id}/analyze-bpm`, {
                        method: 'POST'
                    });
                    const data = await response.json();
                    if (data.bpm) {
                        track.bpm = data.bpm;
                    }
                } catch (error) {
                    console.error('Error analyzing BPM:', error);
                }
            }

            this.bpmElement.textContent = track.bpm ? `${track.bpm} BPM` : '--- BPM';

            // Génère la forme d'onde
            await this.generateWaveform(audioUrl);

        } catch (error) {
            console.error('Error loading track:', error);
            this.showError('Erreur lors du chargement du morceau');
        }
    }

    ejectTrack() {
        if (this.currentTrack) {
            this.audioEngine.stop();
            this.currentTrack = null;
            this.position = 0;
            this.isPlaying = false;

            // Réinitialise l'interface
            this.titleElement.textContent = 'Aucun morceau';
            this.artistElement.textContent = '-';
            this.bpmElement.textContent = '--- BPM';
            this.timeElement.textContent = '--:--';
            this.waveform.innerHTML = '';
            this.updatePlayButton();
        }
    }

    togglePlay() {
        if (!this.currentTrack) return;

        if (this.isPlaying) {
            this.audioEngine.pause();
        } else {
            this.audioEngine.play();
        }
    }

    pressCue() {
        if (!this.currentTrack) return;

        if (this.isPlaying) {
            this.position = this.audioEngine.getCurrentTime();
            this.audioEngine.pause();
        }
        this.audioEngine.seekTo(this.position);
        this.audioEngine.play();
    }

    releaseCue() {
        if (!this.currentTrack || !this.cueButton.classList.contains('active')) return;

        this.audioEngine.pause();
        this.audioEngine.seekTo(this.position);
    }

    async generateWaveform(audioUrl) {
        try {
            // Charge l'audio dans un contexte WebAudio pour l'analyse
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Récupère les données audio
            const channelData = audioBuffer.getChannelData(0);
            const samples = 200; // nombre de points dans la forme d'onde
            const blockSize = Math.floor(channelData.length / samples);
            const dataPoints = [];

            // Calcule les amplitudes moyennes
            for (let i = 0; i < samples; i++) {
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(channelData[i * blockSize + j]);
                }
                dataPoints.push(sum / blockSize);
            }

            // Normalise les valeurs
            const maxAmplitude = Math.max(...dataPoints);
            const normalizedData = dataPoints.map(point => point / maxAmplitude);

            // Dessine la forme d'onde
            this.drawWaveform(normalizedData);

        } catch (error) {
            console.error('Error generating waveform:', error);
        }
    }

    drawWaveform(data, frequencyData = null) {
        const canvas = document.createElement('canvas');
        canvas.width = this.waveform.clientWidth;
        canvas.height = this.waveform.clientHeight;
        this.waveform.innerHTML = '';
        this.waveform.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;
        const barWidth = width / data.length;

        // Fond noir
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Analyse spectrale pour détecter les basses
        const analyseSpectrum = (data) => {
            const fftSize = 2048;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = fftSize;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            analyser.getFloatFrequencyData(dataArray);

            // Calcule l'intensité moyenne des basses (0-200Hz)
            const lowFreqBins = Math.floor(200 * bufferLength / audioContext.sampleRate);
            let bassIntensity = 0;

            for (let i = 0; i < lowFreqBins; i++) {
                bassIntensity += Math.abs(dataArray[i]);
            }
            bassIntensity = bassIntensity / lowFreqBins;

            return Math.min(1, Math.max(0, (bassIntensity + 140) / 70)); // Normalisation
        };

        data.forEach((amplitude, index) => {
            const x = index * barWidth;
            const barHeight = amplitude * (height / 2);

            // Calcule la couleur en fonction des basses
            const bassIntensity = amplitude * 2; // Amplification des basses
            const red = Math.floor(50 + (205 * bassIntensity)); // Plus de rouge = plus de basses
            const blue = Math.floor(255 - (205 * bassIntensity)); // Moins de bleu = plus de basses
            ctx.fillStyle = `rgb(${red}, 50, ${blue})`;

            // Dessine la forme d'onde
            ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
            ctx.fillRect(x, centerY, barWidth - 1, barHeight);

            // Ajoute de la brillance proportionnelle à l'amplitude
            const glowOpacity = Math.min(0.3, amplitude * 0.5);
            ctx.fillStyle = `rgba(255, 255, 255, ${glowOpacity})`;
            ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
        });

        // Ajoute les canvas de superposition
        this.progressCanvas = document.createElement('canvas');
        this.progressCanvas.width = width;
        this.progressCanvas.height = height;
        this.progressCanvas.style.position = 'absolute';
        this.progressCanvas.style.top = '0';
        this.progressCanvas.style.left = '0';
        this.progressCanvas.style.pointerEvents = 'none';
        this.waveform.appendChild(this.progressCanvas);

        // Canvas pour la visualisation en temps réel des fréquences
        this.freqCanvas = document.createElement('canvas');
        this.freqCanvas.width = width;
        this.freqCanvas.height = height;
        this.freqCanvas.style.position = 'absolute';
        this.freqCanvas.style.top = '0';
        this.freqCanvas.style.left = '0';
        this.freqCanvas.style.pointerEvents = 'none';
        this.waveform.appendChild(this.freqCanvas);

        // Lance l'animation des fréquences
        this.startFrequencyAnimation();
    }

    updateProgress(position) {
        if (!this.progressCanvas || !this.audioEngine.getDuration()) return;

        const ctx = this.progressCanvas.getContext('2d');
        const width = this.progressCanvas.width;
        const height = this.progressCanvas.height;

        // Efface le canvas précédent
        ctx.clearRect(0, 0, width, height);

        // Calcule la position en pixels
        const progressWidth = (position / this.audioEngine.getDuration()) * width;

        // Draw progress area with waveform effect
        ctx.fillStyle = 'rgba(50, 50, 50, 0.6)';
        ctx.fillRect(0, 0, progressWidth, height);

        // Draw playhead cursor with glow effect
        const cursorWidth = 3;
        const cursorHeight = height;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(
            progressWidth, height/2, 0,
            progressWidth, height/2, 20
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(progressWidth - 20, 0, 40, height);

        // Center line with gradient
        const lineGradient = ctx.createLinearGradient(0, 0, 0, height);
        lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = lineGradient;
        ctx.fillRect(progressWidth - cursorWidth/2, 0, cursorWidth, cursorHeight);
    }

    updateTimeDisplay(currentTime, duration) {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Met à jour le temps affiché
        this.timeElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

        // Met à jour la progression sur la forme d'onde
        this.updateProgress(currentTime);
    }

    startFrequencyAnimation() {
        // Variables pour le lissage des valeurs
        let lastFreqs = new Array(1024).fill(0);

        const updateFrequencies = () => {
            if (!this.isPlaying || !this.freqCanvas) return;

            // Animation continue même si pas de données
            requestAnimationFrame(updateFrequencies);

            const freqData = this.audioEngine.getFrequencyData();
            if (!freqData) return;

            const ctx = this.freqCanvas.getContext('2d');
            const width = this.freqCanvas.width;
            const height = this.freqCanvas.height;
            const centerY = height / 2;

            // Efface le canvas
            ctx.clearRect(0, 0, width, height);

            // Nombre de bandes de fréquences à afficher
            const bands = Math.min(freqData.length, width);
            const barWidth = width / bands;

            // Dessine les bandes de fréquences
            for (let i = 0; i < bands; i++) {
                // Lissage des valeurs pour une animation plus fluide
                lastFreqs[i] = lastFreqs[i] * 0.8 + (freqData[i] / 255.0) * 0.2;
                const amplitude = lastFreqs[i];
                const barHeight = amplitude * (height / 2);

                // Détermine la couleur en fonction de la fréquence
                if (i < bands * 0.33) {
                    // Basses - Rouge vers Orange
                    ctx.fillStyle = `rgba(255, ${Math.floor(50 + amplitude * 150)}, 50, ${0.3 + amplitude * 0.7})`;
                } else if (i < bands * 0.66) {
                    // Médiums - Vert avec teinte
                    ctx.fillStyle = `rgba(${Math.floor(50 + amplitude * 100)}, 255, ${Math.floor(50 + amplitude * 100)}, ${0.3 + amplitude * 0.7})`;
                } else {
                    // Aigus - Bleu vers Violet
                    ctx.fillStyle = `rgba(${Math.floor(50 + amplitude * 150)}, 50, 255, ${0.3 + amplitude * 0.7})`;
                }

                // Dessine les barres symétriquement
                ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 1, barHeight);
                ctx.fillRect(i * barWidth, centerY, barWidth - 1, barHeight);
                // Ajoute un effet de brillance
                const gradient = ctx.createLinearGradient(
                    i * barWidth,
                    centerY - barHeight,
                    i * barWidth,
                    centerY + barHeight
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

                ctx.fillStyle = gradient;
                ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 1, barHeight * 2);
            }
        };

        // Lance l'animation
        updateFrequencies();
    }

    updatePlayButton() {
        const icon = this.playButton.querySelector('.material-icons');
        icon.textContent = this.isPlaying ? 'pause' : 'play_arrow';
    }

    updateVolumeMeter() {
        if (!this.volumeMeter) {
            console.warn(`Volume meter element not found for deck ${this.deckId}`);
            return;
        }

        if (!this.audioEngine || !this.isPlaying) {
            this.volumeMeter.style.height = '0%';
            return;
        }

        // Get current VU meter level from audio engine
        const level = this.audioEngine.getVUMeterData();
        const meterHeight = Math.min(100, level * 100 * this.volume);

        // Update meter height
        this.volumeMeter.style.height = `${meterHeight}%`;

        // Update color based on level
        if (meterHeight > 80) {
            this.volumeMeter.style.backgroundColor = 'var(--danger-color)';
        } else if (meterHeight > 60) {
            this.volumeMeter.style.backgroundColor = '#ffff00';
        } else {
            this.volumeMeter.style.backgroundColor = 'var(--success-color)';
        }
    }

    openTrackSelector() {
        // Déselectionne les autres decks
        document.querySelectorAll('.deck').forEach(deck => deck.classList.remove('selected'));
        this.waveform.closest('.deck').classList.add('selected');

        // Émet un événement pour informer la bibliothèque que ce deck est sélectionné
        document.dispatchEvent(new CustomEvent('deckSelected', { detail: this.deckId }));
    }

    showError(message) {
        // TODO: Implémenter un système de notifications
        console.error('❌', message);
    }
}

// Initialize decks and controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize layout controls
        const layout2DecksBtn = document.getElementById('layout2Decks');
        const layout4DecksBtn = document.getElementById('layout4Decks');

        if (layout2DecksBtn && layout4DecksBtn) {
            layout2DecksBtn.addEventListener('click', () => {
                const container = document.querySelector('.decks-container');
                if (container) container.classList.remove('layout-4decks');
            });

            layout4DecksBtn.addEventListener('click', () => {
                const container = document.querySelector('.decks-container');
                if (container) container.classList.add('layout-4decks');
            });
        }

        // Initialize visualization controls
        const spectrumControls = {
            vertical: document.getElementById('spectrumVertical'),
            horizontal: document.getElementById('spectrumHorizontal'),
            off: document.getElementById('spectrumOff')
        };

        if (spectrumControls.vertical && spectrumControls.horizontal && spectrumControls.off) {
            spectrumControls.vertical.addEventListener('click', () => {
                document.querySelectorAll('.waveform').forEach(w => {
                    w.classList.remove('spectrum-horizontal');
                    w.classList.add('spectrum-vertical');
                });
            });

            spectrumControls.horizontal.addEventListener('click', () => {
                document.querySelectorAll('.waveform').forEach(w => {
                    w.classList.remove('spectrum-vertical');
                    w.classList.add('spectrum-horizontal');
                });
            });

            spectrumControls.off.addEventListener('click', () => {
                document.querySelectorAll('.waveform').forEach(w => {
                    w.classList.remove('spectrum-vertical', 'spectrum-horizontal');
                });
            });
        }

        // Initialize decks
        window.deckA = new DeckController('A');
        window.deckB = new DeckController('B');
        console.log('✅ All decks initialized successfully');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

