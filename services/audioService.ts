// A self-contained service for generating UI sound effects using the Web Audio API.

let audioCtx: AudioContext | null = null;
let isInitialized = false;

/**
 * Initializes the AudioContext. Must be called from a user gesture (e.g., click).
 * This is crucial for audio to work on mobile browsers.
 */
const initAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // A common trick to "unlock" the audio context on mobile browsers
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
        isInitialized = true;
    } catch (e) {
        console.error("AudioService: Failed to initialize AudioContext.", e);
    }
};

const play = (nodes: (ctx: AudioContext, time: number) => AudioNode[]) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const soundNodes = nodes(audioCtx, now);
    if (soundNodes.length > 0) {
        // Connect the last node in the chain to the destination
        soundNodes[soundNodes.length-1].connect(audioCtx.destination);
    }
};

export const playStartupSound = () => {
    play((ctx, now) => {
        // Low frequency hum that builds up
        const hum = ctx.createOscillator();
        const humGain = ctx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(50, now);
        hum.frequency.exponentialRampToValueAtTime(120, now + 1);
        humGain.gain.setValueAtTime(0.001, now);
        humGain.gain.exponentialRampToValueAtTime(0.2, now + 0.5);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        hum.connect(humGain);
        hum.start(now);
        hum.stop(now + 1.2);

        // High-frequency digital sweep
        const sweep = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweep.type = 'sawtooth';
        sweep.frequency.setValueAtTime(500, now + 0.6);
        sweep.frequency.exponentialRampToValueAtTime(2000, now + 1);
        sweepGain.gain.setValueAtTime(0.001, now + 0.6);
        sweepGain.gain.exponentialRampToValueAtTime(0.1, now + 0.7);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        sweep.connect(sweepGain);
        sweep.start(now + 0.6);
        sweep.stop(now + 1);
        
        // Connect both sounds to the destination
        humGain.connect(ctx.destination);
        sweepGain.connect(ctx.destination);
        return []; // Return empty array as we connected directly
    });
};

export const playUserLoginSound = () => {
    play((ctx, now) => {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        // A quick, positive, upward-resolving chime
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 1200;
        osc1.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.1);
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 1800;
        osc2.connect(gainNode);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);

        return [gainNode];
    });
};

export const playAdminLoginSound = () => {
    play((ctx, now) => {
        // Deep bass thump for authority
        const thump = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(150, now);
        thump.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        thumpGain.gain.setValueAtTime(0.4, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        thump.connect(thumpGain);
        thump.start(now);
        thump.stop(now + 0.2);

        // Sharp confirmation beep
        const beep = ctx.createOscillator();
        const beepGain = ctx.createGain();
        beep.type = 'square';
        beep.frequency.value = 1000;
        beepGain.gain.setValueAtTime(0.1, now + 0.1);
        beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        beep.connect(beepGain);
        beep.start(now + 0.1);
        beep.stop(now + 0.2);
        
        thumpGain.connect(ctx.destination);
        beepGain.connect(ctx.destination);
        return [];
    });
};

export const playMicOnSound = () => {
    play((ctx, now) => {
        // Short, sharp digital "tick"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 2500;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);
        return [gain];
    });
};

export const playMicOffSound = () => {
    play((ctx, now) => {
        // A slightly lower-pitched "tock"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1500;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);
        return [gain];
    });
};

export const playErrorSound = () => {
    play((ctx, now) => {
        // A quick, descending "buzz" for error
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 220; // A3 note
        osc1.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.1);
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 185; // F#3 note
        osc2.connect(gainNode);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.2);

        return [gainNode];
    });
};
