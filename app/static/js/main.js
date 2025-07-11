document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Global audio engine
    window.audioEngine = new AudioEngine(audioContext);

    // Initialize mixer
    window.mixer = new Mixer();

    // Add click handler for all audio elements to start audio context
    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });

    // Library toggle functionality
    const libraryPanel = document.querySelector('.library-panel');
    const libraryToggle = document.querySelector('.library-toggle');

    if (libraryPanel && libraryToggle) {
        libraryToggle.addEventListener('click', () => {
            libraryPanel.classList.toggle('hidden');
            localStorage.setItem('libraryVisible', !libraryPanel.classList.contains('hidden'));
        });

        // Restore library state from localStorage
        const libraryVisible = localStorage.getItem('libraryVisible') === 'true';
        if (!libraryVisible) {
            libraryPanel.classList.add('hidden');
        }
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Spacebar: Play/Pause active deck
        if (e.code === 'Space' && !e.repeat && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const activeDeck = window.deckControllers?.find(deck => deck.isActive);
            if (activeDeck) {
                activeDeck.togglePlay();
            }
        }

        // Number keys 1-4: Select deck
        if (e.code.match(/^Digit[1-4]$/) && !e.repeat && !e.target.matches('input, textarea')) {
            const deckNumber = parseInt(e.key) - 1;
            window.deckControllers?.[deckNumber]?.activate();
        }
    });

    // Handle drag and drop for the entire window
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files)
            .filter(file => file.type.startsWith('audio/'));

        if (files.length > 0) {
            window.mixer?.trackLibrary?.handleFileUpload(files);
        }
    });

    // Update spectrum analyzers
    function updateSpectrums() {
        window.deckControllers?.forEach(deck => {
            if (deck.isPlaying && deck.analyser) {
                const canvas = document.querySelector(`#spectrum-${deck.deckNumber}`);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const spectrum = new Uint8Array(deck.analyser.frequencyBinCount);
                    deck.analyser.getByteFrequencyData(spectrum);

                    // Clear canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw spectrum
                    const barWidth = canvas.width / spectrum.length;
                    const heightScale = canvas.height / 256;

                    ctx.fillStyle = 'rgba(0, 110, 255, 0.8)';
                    for (let i = 0; i < spectrum.length; i++) {
                        const height = spectrum[i] * heightScale;
                        ctx.fillRect(
                            i * barWidth,
                            canvas.height - height,
                            barWidth - 1,
                            height
                        );
                    }
                }
            }
        });

        requestAnimationFrame(updateSpectrums);
    }

    // Start spectrum animation
    updateSpectrums();
});
