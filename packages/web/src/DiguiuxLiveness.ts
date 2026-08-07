import type {
  PromptConfig,
  CapturedFrame,
  CaptureResult,
  GateBlockReason,
  OvalGuide,
} from '@diguiux/liveness-core';
import {
  evaluateGate,
  advanceBlinkState,
  advanceNodState,
  initialBlinkState,
  initialNodState,
  DEFAULT_GATE_HINTS,
  computePositionVariance,
  evaluateFaceQuality,
  type BlinkState,
  type NodState,
  type DetectedFace,
} from '@diguiux/liveness-core';
import { initFaceDetector, type FaceLandmarkResult } from './face-detector';
import { styles } from './styles';

const SDK_VERSION = '0.1.0';
const THROTTLE_MS = 50;
const READY_DEBOUNCE_MS = 300;
const STATIC_VARIANCE_MAX = 12;
const STATIC_DURATION_MS = 1600;
const MOTION_MAX_SAMPLES = 12;
const SUCCESS_DISPLAY_MS = 700;

const ACTION_PROMPTS = new Set(['blink', 'nod', 'smile']);
const FILLER_PROMPTS = new Set(['center_face']);

type Phase = 'instructions' | 'capturing' | 'success' | 'complete';

export interface LivenessOptions {
  prompts: PromptConfig[];
  showInstructions?: boolean;
  themePrimary?: string;
  enableLogs?: boolean;
}

/**
 * <diguiux-liveness> Web Component
 */
export class DiguiuxLiveness extends HTMLElement {
  static get observedAttributes() {
    return ['theme-primary'];
  }

  // ─── Config ───
  private _prompts: PromptConfig[] = [];
  private _showInstructions = true;
  private _themePrimary = '#F97316';
  private _enableLogs = false;

  // ─── State ───
  private _phase: Phase = 'instructions';
  private _promptIndex = 0;
  private _frames: CapturedFrame[] = [];
  private _startTime = 0;
  private _blockReason: GateBlockReason | null = 'no_face';

  // ─── Temporal state ───
  private _motionSamples: { cx: number; cy: number }[] = [];
  private _lowMotionSince: number | null = null;
  private _readySince: number | null = null;
  private _lastProcessAt = 0;
  private _blinkState: BlinkState = initialBlinkState();
  private _nodState: NodState = initialNodState();
  private _primed = false;
  private _capturing = false;
  private _loopActive = false;

  // ─── DOM refs ───
  private _shadow: ShadowRoot;
  private _video: HTMLVideoElement | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _overlayCanvas: HTMLCanvasElement | null = null;
  private _stream: MediaStream | null = null;
  private _faceDetector: Awaited<ReturnType<typeof initFaceDetector>> | null = null;
  private _smoothYaw = 0;
  private _smoothPitch = 0;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
  }

  // ─── Public API ───
  set prompts(value: PromptConfig[]) {
    this._prompts = value;
  }
  get prompts() {
    return this._prompts;
  }
  set showInstructions(value: boolean) {
    this._showInstructions = value;
  }
  set enableLogs(value: boolean) {
    this._enableLogs = value;
  }

  private _log(...args: unknown[]) {
    if (this._enableLogs) console.log('[LivenessWeb]', ...args);
  }

  // ─── Lifecycle ───
  connectedCallback() {
    this._themePrimary = this.getAttribute('theme-primary') || this._themePrimary;
    this._phase = this._showInstructions ? 'instructions' : 'capturing';
    this._render();
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name: string, _old: string, val: string) {
    if (name === 'theme-primary') this._themePrimary = val;
  }

  private _cleanup() {
    this._loopActive = false;
    this._stopCamera();
  }

  // ─── Camera ───
  private async _startCamera() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (this._video) {
        this._video.srcObject = this._stream;
        await this._video.play();
      }
      this._faceDetector = await initFaceDetector();
      this._log('Camera started');
      this._startProcessingLoop();
    } catch (err) {
      this._emit('error', err instanceof Error ? err : new Error('Camera access denied'));
    }
  }

  private _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  // ─── Processing loop (requestVideoFrameCallback with rAF fallback) ───
  private _startProcessingLoop() {
    this._loopActive = true;
    const video = this._video;
    if (!video) return;

    if ('requestVideoFrameCallback' in video) {
      const tick = () => {
        if (!this._loopActive) return;
        this._processFrame();
        (video as any).requestVideoFrameCallback(tick);
      };
      (video as any).requestVideoFrameCallback(tick);
    } else {
      const tick = () => {
        if (!this._loopActive) return;
        this._processFrame();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  private _processFrame() {
    if (this._capturing || this._phase !== 'capturing') return;

    const now = Date.now();
    if (now - this._lastProcessAt < THROTTLE_MS) return;
    this._lastProcessAt = now;

    const video = this._video;
    if (!video || video.readyState < 2 || !this._faceDetector) return;

    const results = this._faceDetector.detect(video);
    this._evaluate(results, now);
    this._drawOverlay();
  }

  // ─── Face evaluation ───
  private _evaluate(results: FaceLandmarkResult, now: number) {
    const prompt = this._prompts[this._promptIndex];
    if (!prompt) return;

    const oval = this._getOvalGuide();
    const faces = this._normalizeFaces(results);
    const isActionPrompt = ACTION_PROMPTS.has(prompt.id);

    // Blink / nod state machines
    if (faces.length === 1) {
      if (prompt.id === 'blink') {
        this._blinkState = advanceBlinkState(
          this._blinkState,
          faces[0].leftEyeOpenProbability ?? 1,
          faces[0].rightEyeOpenProbability ?? 1,
          now,
        );
      }
      if (prompt.id === 'nod') {
        this._nodState = advanceNodState(this._nodState, faces[0].pitchAngle ?? 0);
      }
    } else {
      this._blinkState = initialBlinkState();
      this._nodState = initialNodState();
    }

    const gate = evaluateGate({
      faces,
      promptId: prompt.id,
      oval,
      blinkDetected: this._blinkState.phase === 'detected',
      nodDetected: this._nodState.wentDown,
    });

    // Position check
    let positioned = false;
    if (faces.length === 1) {
      const q = evaluateFaceQuality({ bounds: faces[0].bounds, oval });
      positioned = !q.outsideOval && !q.tooSmall;
    }

    // Motion tracking
    if (faces.length === 1 && positioned) {
      const b = faces[0].bounds;
      this._motionSamples.push({ cx: b.x + b.width / 2, cy: b.y + b.height / 2 });
      while (this._motionSamples.length > MOTION_MAX_SAMPLES) this._motionSamples.shift();
    } else {
      this._motionSamples = [];
      this._lowMotionSince = null;
    }

    // Anti-static
    let antiStatic: GateBlockReason | null = null;
    if (!this._primed && faces.length === 1 && positioned) {
      const variance = computePositionVariance(this._motionSamples);
      if (variance < STATIC_VARIANCE_MAX) {
        if (this._lowMotionSince == null) this._lowMotionSince = now;
      } else {
        this._lowMotionSince = null;
      }
      if (this._lowMotionSince != null && now - this._lowMotionSince > STATIC_DURATION_MS) {
        antiStatic = 'anti_static';
      }
    } else {
      this._lowMotionSince = null;
    }

    // Display reason
    const displayReason: GateBlockReason | null = !positioned
      ? (faces.length === 0 ? 'no_face' : faces.length > 1 ? 'multi_face' : 'face_not_in_oval')
      : antiStatic ?? gate.reason;

    const okForPriming = isActionPrompt
      ? positioned && antiStatic === null
      : gate.ok && antiStatic === null;
    const okForCapture = gate.ok && antiStatic === null;

    // Ready debounce
    if (!this._primed && okForPriming) {
      if (this._readySince == null) this._readySince = now;
      if (now - this._readySince >= READY_DEBOUNCE_MS) this._primed = true;
    } else if (!okForPriming) {
      this._readySince = null;
      this._primed = false;
    }

    // Update UI hint
    if (displayReason !== this._blockReason) {
      this._blockReason = displayReason;
      this._updateHint();
    }

    // Trigger capture
    if (this._primed && okForCapture) {
      if (FILLER_PROMPTS.has(prompt.id)) {
        this._advanceWithoutCapture();
      } else {
        this._captureFrame();
      }
    }
  }

  // ─── Capture via canvas ───
  private _captureFrame() {
    if (this._capturing) return;
    this._capturing = true;

    const video = this._video;
    const canvas = this._canvas;
    if (!video || !canvas) { this._capturing = false; return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) { this._capturing = false; return; }

      const uri = URL.createObjectURL(blob);
      const prompt = this._prompts[this._promptIndex];
      const frame: CapturedFrame = {
        prompt,
        uri,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
      };
      this._frames.push(frame);
      this._log('Captured:', prompt.id);
      this._emit('promptcomplete', { prompt, frame });
      this._emit('progress', { completed: this._promptIndex + 1, total: this._prompts.length, currentPrompt: prompt });
      this._showSuccess(() => { this._capturing = false; this._advancePrompt(); });
    }, 'image/jpeg', 0.85);
  }

  private _advanceWithoutCapture() {
    this._capturing = true;
    this._showSuccess(() => { this._capturing = false; this._advancePrompt(); });
  }

  private _advancePrompt() {
    this._promptIndex++;
    if (this._promptIndex >= this._prompts.length) { this._complete(); return; }
    this._resetTemporalState();
    this._emit('promptstart', { prompt: this._prompts[this._promptIndex], index: this._promptIndex });
    this._updatePromptUI();
  }

  private _complete() {
    this._phase = 'complete';
    this._loopActive = false;
    this._stopCamera();
    const result: CaptureResult = {
      version: 1,
      frames: this._frames,
      durationMs: Date.now() - this._startTime,
      deviceOrientation: 'portrait',
      metadata: { sdkVersion: SDK_VERSION },
    };
    this._log('Complete:', JSON.stringify(result, null, 2));
    this._emit('complete', result);
  }

  private _showSuccess(onDone: () => void) {
    const badge = this._shadow.querySelector('.success-badge') as HTMLElement;
    if (badge) {
      badge.style.opacity = '1';
      setTimeout(() => { badge.style.opacity = '0'; setTimeout(onDone, 150); }, SUCCESS_DISPLAY_MS - 150);
    } else {
      setTimeout(onDone, SUCCESS_DISPLAY_MS);
    }
  }

  private _resetTemporalState() {
    this._motionSamples = [];
    this._lowMotionSince = null;
    this._readySince = null;
    this._lastProcessAt = Date.now() + 600; // cooldown
    this._blinkState = initialBlinkState();
    this._nodState = initialNodState();
    this._primed = false;
    this._blockReason = null;
  }

  // ─── Face normalization ───
  private _normalizeFaces(results: FaceLandmarkResult): DetectedFace[] {
    if (!results.faces.length || !this._video) return [];
    const vw = this._video.videoWidth;
    const vh = this._video.videoHeight;
    const container = this._shadow.querySelector('.camera-container') as HTMLElement;
    const dw = container?.clientWidth || vw;
    const dh = container?.clientHeight || vh;
    const sx = dw / vw;
    const sy = dh / vh;

    return results.faces.map((face) => {
      const box = face.boundingBox;
      // Mirror X for front camera display
      const x = (vw - box.originX - box.width) * sx;
      const y = box.originY * sy;
      const w = box.width * sx;
      const h = box.height * sy;

      // Blendshapes for expressions
      const bs = face.blendshapes;
      const leftBlink = bs['eyeBlinkLeft'] ?? 0;
      const rightBlink = bs['eyeBlinkRight'] ?? 0;
      const smileLeft = bs['mouthSmileLeft'] ?? 0;
      const smileRight = bs['mouthSmileRight'] ?? 0;

      // Map blink blendshape to eye open probability
      // Piecewise: resting (blink <0.2) stays high, blinking (>0.35) drops fast
      const mapBlink = (b: number) => {
        if (b < 0.2) return 1.0 - b * 0.5; // 0.9-1.0 at rest
        return Math.max(0, 1.0 - b * 1.8); // drops fast during blink
      };
      const leftOpen = mapBlink(leftBlink);
      const rightOpen = mapBlink(rightBlink);

      // Head rotation from transformation matrix
      // Smooth to reduce jitter (exponential moving average)
      const rawYaw = face.headRotation.yaw;
      const rawPitch = face.headRotation.pitch;
      this._smoothYaw = this._smoothYaw * 0.6 + rawYaw * 0.4;
      this._smoothPitch = this._smoothPitch * 0.6 + rawPitch * 0.4;
      const yaw = this._smoothYaw;
      const pitch = this._smoothPitch;

      return {
        bounds: { x, y, width: w, height: h },
        yawAngle: yaw,
        pitchAngle: pitch,
        leftEyeOpenProbability: leftOpen,
        rightEyeOpenProbability: rightOpen,
        smilingProbability: (smileLeft + smileRight) / 2,
      };
    });
  }

  private _getOvalGuide(): OvalGuide {
    const container = this._shadow.querySelector('.camera-container') as HTMLElement;
    const w = container?.clientWidth || 400;
    const h = container?.clientHeight || 600;
    // Make oval proportional to viewport — larger to accommodate close webcams
    const ovalW = Math.min(w * 0.65, 320);
    const ovalH = ovalW * 1.35;
    return { cx: w / 2, cy: h / 2, width: ovalW, height: ovalH, edgeInsetPx: 30 };
  }

  // ─── Overlay ───
  private _drawOverlay() {
    const canvas = this._overlayCanvas;
    const container = this._shadow.querySelector('.camera-container') as HTMLElement;
    if (!canvas || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    const oval = this._getOvalGuide();
    const rx = oval.width / 2;
    const ry = oval.height / 2;

    // Dark mask with cutout
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(oval.cx, oval.cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ring
    ctx.beginPath();
    ctx.ellipse(oval.cx, oval.cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = this._blockReason ? 'rgba(255,255,255,0.5)' : this._themePrimary;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ─── UI helpers ───
  private _updateHint() {
    const el = this._shadow.querySelector('.hint') as HTMLElement;
    if (!el) return;
    if (this._blockReason) {
      el.textContent = DEFAULT_GATE_HINTS[this._blockReason] || '';
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  private _updatePromptUI() {
    const prompt = this._prompts[this._promptIndex];
    const titleEl = this._shadow.querySelector('.prompt-title') as HTMLElement;
    const progressEl = this._shadow.querySelector('.progress') as HTMLElement;
    if (titleEl) titleEl.textContent = prompt?.instruction || '';
    if (progressEl) this._renderProgressDashes(progressEl);
  }

  private _renderProgressDashes(el: HTMLElement) {
    el.innerHTML = this._prompts.map((_, i) =>
      `<div class="progress-dash ${i <= this._promptIndex ? 'active' : ''}"></div>`
    ).join('');
  }

  private _emit(name: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ─── Render ───
  private _render() {
    this._phase === 'instructions' ? this._renderInstructions() : this._renderCapture();
  }

  private _renderInstructions() {
    this._shadow.innerHTML = `
      <style>${styles(this._themePrimary)}</style>
      <div class="instructions-container">
        <div class="instructions-content">
          <div class="icon-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M9 16C9.85 16.63 10.88 17 12 17C13.12 17 14.15 16.63 15 16" stroke="#1E3A5F" stroke-width="1.5" stroke-linecap="round"/>
              <ellipse cx="15" cy="10.5" rx="1" ry="1.5" fill="#1E3A5F"/>
              <ellipse cx="9" cy="10.5" rx="1" ry="1.5" fill="#1E3A5F"/>
              <path d="M22 14C22 17.77 22 19.66 20.83 20.83C19.66 22 17.77 22 14 22" stroke="#1E3A5F" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M10 22C6.23 22 4.34 22 3.17 20.83C2 19.66 2 17.77 2 14" stroke="#1E3A5F" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M10 2C6.23 2 4.34 2 3.17 3.17C2 4.34 2 6.23 2 10" stroke="#1E3A5F" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M14 2C17.77 2 19.66 2 20.83 3.17C22 4.34 22 6.23 22 10" stroke="#1E3A5F" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="instructions-title">Verify Your Identity</h1>
          <p class="instructions-subtitle">We'll guide you through a few simple steps to confirm you're a real person.</p>
          <div class="tips">
            <p class="tips-header">For best results:</p>
            <div class="tip-row"><span class="bullet"></span><span>Ensure good, even lighting on your face</span></div>
            <div class="tip-row"><span class="bullet"></span><span>Center your face in the guide</span></div>
            <div class="tip-row"><span class="bullet"></span><span>Remove glasses or obstructions</span></div>
          </div>
        </div>
        <div class="instructions-footer">
          <button class="primary-btn" id="ready-btn">I'm Ready</button>
          <div class="brand-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11 5.17-.84 9-5.75 9-11V7l-9-5z" fill="${this._themePrimary}"/></svg>
            <span>Powered by Digital Factory</span>
          </div>
        </div>
      </div>`;
    this._shadow.getElementById('ready-btn')!.addEventListener('click', () => {
      this._phase = 'capturing';
      this._startTime = Date.now();
      this._renderCapture();
    });
  }

  private _renderCapture() {
    const prompt = this._prompts[this._promptIndex];
    this._shadow.innerHTML = `
      <style>${styles(this._themePrimary)}</style>
      <div class="camera-container">
        <video autoplay playsinline muted></video>
        <canvas class="capture-canvas" style="display:none;"></canvas>
        <canvas class="overlay-canvas"></canvas>
        <div class="ui-layer">
          <div class="top-bar">
            <button class="close-btn" id="cancel-btn">✕</button>
            <div class="progress"></div>
            <div class="spacer"></div>
          </div>
          <div class="prompt-area">
            <div class="prompt-title">${prompt?.instruction || ''}</div>
            <div class="hint" style="display:none;"></div>
          </div>
          <div class="center-area">
            <div class="success-badge" style="opacity:0;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="brand-footer brand-footer--dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11 5.17-.84 9-5.75 9-11V7l-9-5z" fill="${this._themePrimary}"/></svg>
              <span>Powered by Digital Factory</span>
            </div>
          </div>
        </div>
      </div>`;

    this._video = this._shadow.querySelector('video');
    this._canvas = this._shadow.querySelector('.capture-canvas');
    this._overlayCanvas = this._shadow.querySelector('.overlay-canvas');
    const progressEl = this._shadow.querySelector('.progress') as HTMLElement;
    if (progressEl) this._renderProgressDashes(progressEl);
    this._shadow.getElementById('cancel-btn')!.addEventListener('click', () => {
      this._cleanup();
      this._resetFull();
      this._emit('cancel', null);
    });
    this._startCamera();
  }

  private _resetFull() {
    this._phase = 'instructions';
    this._promptIndex = 0;
    this._frames = [];
    this._startTime = 0;
    this._blockReason = 'no_face';
    this._resetTemporalState();
  }
}

// Register
if (typeof customElements !== 'undefined' && !customElements.get('diguiux-liveness')) {
  customElements.define('diguiux-liveness', DiguiuxLiveness);
}
