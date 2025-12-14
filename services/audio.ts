class AudioService {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    // Initialize lazily to respect browser autoplay policies
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0.5; // Master volume
    }
  }

  public playNote(frequency: number, duration: number = 0.5) {
    this.init();
    if (!this.ctx || !this.gainNode) return;

    const now = this.ctx.currentTime;
    
    // Create oscillators for a fuller sound (piano simulation attempt)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    
    // Triangle wave for the body, sine for the fundamental
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc3.type = 'sine';

    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency, now);
    osc3.frequency.setValueAtTime(frequency * 2, now); // Overtone

    // Envelope for the note (Attack, Decay, Sustain, Release)
    const noteGain = this.ctx.createGain();
    noteGain.connect(this.gainNode);

    // Hard attack
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(1, now + 0.02);
    // Exponential decay
    noteGain.gain.exponentialRampToValueAtTime(0.01, now + duration + 1.5);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    
    // Lower volume for overtone
    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.value = 0.1;
    overtoneGain.connect(noteGain);
    osc3.connect(overtoneGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration + 2);
    osc2.stop(now + duration + 2);
    osc3.stop(now + duration + 2);
  }
}

export const audioService = new AudioService();