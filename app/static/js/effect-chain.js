class EffectChain {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.effects = new Map();
        this.activeEffects = new Set();

        this.setupEffects();
        this.setupControls();
    }

    setupEffects() {
        // EQ à 3 bandes
        this.createEQ();

        // Effets supplémentaires
        this.effects.set('filter', {
            node: this.audioEngine.createEffect('filter'),
            controls: {
                frequency: { min: 20, max: 20000, default: 1000 },
                Q: { min: 0.1, max: 10, default: 1 },
                gain: { min: -40, max: 40, default: 0 }
            }
        });

        this.effects.set('delay', {
            node: this.audioEngine.createEffect('delay'),
            controls: {
                time: { min: 0, max: 1, default: 0.3 },
                feedback: { min: 0, max: 1, default: 0.5 }
            }
        });

        this.effects.set('reverb', {
            node: this.audioEngine.createEffect('reverb'),
            controls: {
                mix: { min: 0, max: 1, default: 0.5 }
            }
        });

        this.effects.set('compressor', {
            node: this.audioEngine.createEffect('compressor'),
            controls: {
                threshold: { min: -60, max: 0, default: -24 },
                ratio: { min: 1, max: 20, default: 4 },
                attack: { min: 0, max: 1, default: 0.003 },
                release: { min: 0, max: 1, default: 0.25 }
            }
        });
    }

    createEQ() {
        // EQ basse
        this.effects.set('lowEQ', {
            node: this.audioEngine.createEffect('filter'),
            controls: {
                gain: { min: -40, max: 40, default: 0 }
            }
        });
        this.effects.get('lowEQ').node.type = 'lowshelf';
        this.effects.get('lowEQ').node.frequency.value = 200;

        // EQ medium
        this.effects.set('midEQ', {
            node: this.audioEngine.createEffect('filter'),
            controls: {
                gain: { min: -40, max: 40, default: 0 }
            }
        });
        this.effects.get('midEQ').node.type = 'peaking';
        this.effects.get('midEQ').node.frequency.value = 1000;
        this.effects.get('midEQ').node.Q.value = 1;

        // EQ haute
        this.effects.set('highEQ', {
            node: this.audioEngine.createEffect('filter'),
            controls: {
                gain: { min: -40, max: 40, default: 0 }
            }
        });
        this.effects.get('highEQ').node.type = 'highshelf';
        this.effects.get('highEQ').node.frequency.value = 4000;

        // Active l'EQ par défaut
        this.activeEffects.add('lowEQ');
        this.activeEffects.add('midEQ');
        this.activeEffects.add('highEQ');
    }

    setupControls() {
        // Récupère les contrôles EQ
        const eqControls = document.querySelectorAll(`[data-eq="${this.audioEngine.deckId}"]`);
        eqControls.forEach(control => {
            const band = control.dataset.band;
            const eq = this.effects.get(`${band}EQ`);

            control.addEventListener('input', () => {
                eq.node.gain.value = parseFloat(control.value);
            });

            // Initialise avec les valeurs par défaut
            control.value = eq.controls.gain.default;
        });

        // Récupère les contrôles des effets
        const fxControls = document.querySelectorAll(`[data-fx="${this.audioEngine.deckId}"]`);
        fxControls.forEach(control => {
            const effect = this.effects.get(control.dataset.effect);
            const param = control.dataset.param;

            control.addEventListener('input', () => {
                effect.node[param].value = parseFloat(control.value);
            });

            // Initialise avec les valeurs par défaut
            control.value = effect.controls[param].default;
            control.min = effect.controls[param].min;
            control.max = effect.controls[param].max;
        });

        // Récupère les toggles d'effets
        const fxToggles = document.querySelectorAll(`[data-fx-toggle="${this.audioEngine.deckId}"]`);
        fxToggles.forEach(toggle => {
            const effectName = toggle.dataset.effect;

            toggle.addEventListener('click', () => {
                if (toggle.classList.contains('active')) {
                    this.disableEffect(effectName);
                    toggle.classList.remove('active');
                } else {
                    this.enableEffect(effectName);
                    toggle.classList.add('active');
                }
            });

            // Active les effets par défaut
            if (this.activeEffects.has(effectName)) {
                toggle.classList.add('active');
            }
        });
    }

    enableEffect(effectName) {
        const effect = this.effects.get(effectName);
        if (!effect) return;

        this.activeEffects.add(effectName);
        this.updateEffectChain();
    }

    disableEffect(effectName) {
        const effect = this.effects.get(effectName);
        if (!effect) return;

        this.activeEffects.delete(effectName);
        this.updateEffectChain();
    }

    updateEffectChain() {
        // Déconnecte tous les effets
        this.effects.forEach(effect => {
            this.audioEngine.disconnectEffect(effect.node);
        });

        // Recrée la chaîne d'effets dans l'ordre
        let lastNode = this.audioEngine.gainNode;
        const activeEffects = Array.from(this.activeEffects)
            .map(name => this.effects.get(name))
            .filter(effect => effect);

        activeEffects.forEach(effect => {
            lastNode.connect(effect.node);
            lastNode = effect.node;
        });

        // Connecte le dernier effet à l'analyseur
        lastNode.connect(this.audioEngine.analyserNode);
    }

    resetEffects() {
        // Réinitialise tous les effets à leurs valeurs par défaut
        this.effects.forEach((effect, name) => {
            Object.entries(effect.controls).forEach(([param, config]) => {
                if (effect.node[param]) {
                    effect.node[param].value = config.default;
                }

                // Met à jour les contrôles visuels
                const control = document.querySelector(
                    `[data-fx="${this.audioEngine.deckId}"][data-effect="${name}"][data-param="${param}"]`
                );
                if (control) {
                    control.value = config.default;
                }
            });
        });
    }
}

// Export pour utilisation dans d'autres fichiers
window.EffectChain = EffectChain;
