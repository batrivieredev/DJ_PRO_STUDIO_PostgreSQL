class AudioEngine {
    constructor(deckId) {
        this.deckId = deckId;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioBuffer = null;
        this.source = null;

        // Audio nodes
        this.gainNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();

        // EQ nodes
        this.lowEQ = this.audioContext.createBiquadFilter();
        this.midEQ = this.audioContext.createBiquadFilter();
        this.highEQ = this.audioContext.createBiquadFilter();
        this.filterNode = this.audioContext.createBiquadFilter();

        // Setup EQ nodes
        this.lowEQ.type = 'lowshelf';
        this.lowEQ.frequency.value = 320;
        this.lowEQ.gain.value = 0;

        this.midEQ.type = 'peaking';
        this.midEQ.frequency.value = 1000;
        this.midEQ.Q.value = 0.5;
        this.midEQ.gain.value = 0;

        this.highEQ.type = 'highshelf';
        this.highEQ.frequency.value = 3200;
        this.highEQ.gain.value = 0;

        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 20000;
        this.filterNode.Q.value = 1;

        // Paramètres de lecture
        this.startTime = 0;
        this.pauseTime = 0;
        this.isPlaying = false;
        this.playbackRate = 1.0;

        // Configuration de l'analyseur pour le VU-mètre
        this.analyserNode.fftSize = 2048;
        this.analyserNode.smoothingTimeConstant = 0.8;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.vuMeterData = new Uint8Array(32); // Pour un VU-mètre plus précis

        // Connect audio nodes
        this.gainNode.connect(this.lowEQ);
        this.lowEQ.connect(this.midEQ);
        this.midEQ.connect(this.highEQ);
        this.highEQ.connect(this.filterNode);
        this.filterNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);

        // Callbacks
        this.onPlayCallback = null;
        this.onPauseCallback = null;
        this.onTimeUpdateCallback = null;
        this.onVUMeterUpdate = null;

        // Lance la mise à jour du temps
        this.startTimeUpdate();
    }

    async loadTrack(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.pauseTime = 0;

            if (this.source) {
                this.source.stop();
                this.source.disconnect();
            }

            return true;
        } catch (error) {
            console.error('Error loading track:', error);
            return false;
        }
    }

    play() {
        if (!this.audioBuffer) return;

        // Crée une nouvelle source
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;

        // Applique la vitesse de lecture actuelle
        this.source.playbackRate.setValueAtTime(this.playbackRate, this.audioContext.currentTime);

        // Configure le VU-mètre
        this.analyserNode.smoothingTimeConstant = 0.4; // Plus réactif pendant la lecture

        // Connect source through the effect chain
        this.source.connect(this.gainNode);

        // Calcule le temps de départ en tenant compte de la vitesse
        const offset = this.pauseTime;
        this.startTime = this.audioContext.currentTime - (offset / this.playbackRate);

        // Lance la lecture
        this.source.start(0, offset);
        this.isPlaying = true;

        // Met à jour l'interface
        if (this.onPlayCallback) {
            this.onPlayCallback();
        }
    }

    pause() {
        if (!this.source || !this.isPlaying) return;

        this.source.stop();
        this.source.disconnect();

        // Calcule le temps de pause en tenant compte de la vitesse
        const elapsedTime = this.audioContext.currentTime - this.startTime;
        this.pauseTime = elapsedTime * this.playbackRate;
        this.isPlaying = false;

        // Réinitialise le smoothing de l'analyseur
        this.analyserNode.smoothingTimeConstant = 0.8;

        if (this.onPauseCallback) {
            this.onPauseCallback();
        }
    }

    stop() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.isPlaying = false;

        if (this.onPauseCallback) {
            this.onPauseCallback();
        }
    }

    seekTo(time) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.source.stop();
            this.source.disconnect();
        }

        // Ajuste le temps en fonction de la vitesse de lecture
        this.pauseTime = time;
        this.startTime = this.audioContext.currentTime - (time / this.playbackRate);

        if (wasPlaying) {
            // Recrée la source avec la nouvelle position
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            this.source.playbackRate.setValueAtTime(this.playbackRate, this.audioContext.currentTime);
            this.source.connect(this.gainNode);
            this.source.start(0, time);
        }
    }

    setVolume(value) {
        // Scale volume logarithmically and limit max volume
        const scaledValue = Math.min(value * 0.7, 1.0); // Limit max volume to 70%
        const gainValue = scaledValue * scaledValue; // Logarithmic scaling

        // Smooth volume transition
        this.gainNode.gain.linearRampToValueAtTime(
            gainValue,
            this.audioContext.currentTime + 0.1
        );
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.source) {
            this.source.playbackRate.setValueAtTime(rate, this.audioContext.currentTime);
        }
    }

    getVUMeterData() {
        // Analyse les basses fréquences pour le VU-mètre
        this.analyserNode.getByteFrequencyData(this.vuMeterData);

        // Calcule la moyenne pondérée des basses et moyennes fréquences
        const bassRange = Math.floor(this.vuMeterData.length * 0.4); // 0-400Hz
        let total = 0;

        for (let i = 0; i < bassRange; i++) {
            // Donne plus de poids aux basses fréquences
            const weight = 1 - (i / bassRange);
            total += this.vuMeterData[i] * weight;
        }

        return total / bassRange;
    }

    getCurrentTime() {
        if (!this.isPlaying) {
            return this.pauseTime;
        }

        // Ajuste le temps en fonction de la vitesse de lecture
        const elapsedTime = this.audioContext.currentTime - this.startTime;
        return elapsedTime * this.playbackRate;
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    getFrequencyData() {
        this.analyserNode.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    onPlay(callback) {
        this.onPlayCallback = callback;
    }

    onPause(callback) {
        this.onPauseCallback = callback;
    }

    onVUMeter(callback) {
        this.onVUMeterUpdate = callback;
    }

    onTimeUpdate(callback) {
        this.onTimeUpdateCallback = callback;
    }

    startTimeUpdate() {
        const updateTime = () => {
            if (this.isPlaying) {
                const currentTime = this.getCurrentTime();
                const duration = this.getDuration();

                // Met à jour le temps et le curseur
                if (this.onTimeUpdateCallback) {
                    this.onTimeUpdateCallback(currentTime, duration);
                }

                // Met à jour le VU-mètre
                if (this.onVUMeterUpdate) {
                    const vuLevel = this.getVUMeterData();
                    this.onVUMeterUpdate(vuLevel);
                }
            }
            requestAnimationFrame(updateTime);
        };
        updateTime();
    }

    // EQ Methods
    setEQ(band, value) {
        const node = {
            'low': this.lowEQ,
            'mid': this.midEQ,
            'high': this.highEQ
        }[band];

        if (node) {
            node.gain.linearRampToValueAtTime(value, this.audioContext.currentTime + 0.1);
        }
    }

    setFilter(value) {
        // Map 0-100 to frequency range (20Hz - 20kHz, logarithmic)
        const minFreq = 20;
        const maxFreq = 20000;
        const freq = minFreq * Math.pow(maxFreq/minFreq, value/100);
        this.filterNode.frequency.linearRampToValueAtTime(freq, this.audioContext.currentTime + 0.1);
    }

    // Effect Methods
    createEffect(type) {
        switch (type) {
            case 'filter':
                return this.audioContext.createBiquadFilter();
            case 'delay':
                return this.audioContext.createDelay();
            case 'reverb':
                return this.createReverb();
            case 'compressor':
                return this.audioContext.createDynamicsCompressor();
            default:
                return null;
        }
    }

    async createReverb(seconds = 3) {
        const convolver = this.audioContext.createConvolver();
        const rate = this.audioContext.sampleRate;
        const length = rate * seconds;
        const impulse = this.audioContext.createBuffer(2, length, rate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.exp(-6 * i / length);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }

        convolver.buffer = impulse;
        return convolver;
    }

    // Méthodes utilitaires pour les effets
    disconnectEffect(effect) {
        if (effect) {
            effect.disconnect();
        }
    }

    connectEffect(effect) {
        if (!effect) return;

        // Déconnecte la sortie actuelle
        this.gainNode.disconnect();

        // Connecte le nouvel effet
        this.gainNode.connect(effect);
        effect.connect(this.analyserNode);
    }
}

// Export pour utilisation dans d'autres fichiers
window.AudioEngine = AudioEngine;
