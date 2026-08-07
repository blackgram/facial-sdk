/**
 * Scoped styles for the <diguiux-liveness> Web Component.
 */
export function styles(primary: string): string {
  return `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* ─── Instructions ─── */
    .instructions-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #F5F6F8;
    }
    .instructions-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }
    .icon-circle {
      width: 96px;
      height: 96px;
      border-radius: 48px;
      background: #E3EBF5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 28px;
    }
    .instructions-title {
      font-size: 26px;
      font-weight: 700;
      color: #1A2B4A;
      text-align: center;
      margin: 0 0 12px;
    }
    .instructions-subtitle {
      font-size: 15px;
      line-height: 1.5;
      color: #6B7280;
      text-align: center;
      margin: 0 0 32px;
      max-width: 320px;
    }
    .tips { align-self: stretch; max-width: 340px; margin: 0 auto; }
    .tips-header { font-size: 15px; font-weight: 700; color: #1A2B4A; margin: 0 0 16px; }
    .tip-row { display: flex; align-items: flex-start; margin-bottom: 12px; padding-left: 4px; }
    .tip-row span:last-child { flex: 1; font-size: 15px; line-height: 1.5; color: #6B7280; }
    .bullet {
      width: 6px; height: 6px; border-radius: 3px;
      background: ${primary}; margin-top: 7px; margin-right: 12px; flex-shrink: 0;
    }
    .instructions-footer { padding: 0 32px 32px; }
    .primary-btn {
      width: 100%; padding: 18px; border: none; border-radius: 12px;
      background: ${primary}; color: #fff; font-size: 16px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.5px;
    }
    .primary-btn:hover { opacity: 0.9; }

    /* ─── Camera ─── */
    .camera-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
    }
    .camera-container video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    .overlay-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }
    .ui-layer {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      pointer-events: none;
    }
    .ui-layer button { pointer-events: auto; }

    /* Top bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .close-btn {
      width: 36px; height: 36px; border-radius: 18px;
      background: rgba(0,0,0,0.45); border: none;
      color: #fff; font-size: 16px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .progress {
      display: flex; gap: 6px; align-items: center; justify-content: center; flex: 1;
    }
    .progress-dash {
      width: 36px; height: 4px; border-radius: 2px;
      background: rgba(255,255,255,0.35);
    }
    .progress-dash.active { background: ${primary}; }
    .spacer { width: 36px; }

    /* Prompt */
    .prompt-area { text-align: center; margin-top: 8px; }
    .prompt-title {
      font-size: 22px; font-weight: 700; color: #fff;
    }
    .hint {
      font-size: 16px; color: rgba(255,255,255,0.85);
      margin-top: 6px;
    }

    /* Center */
    .center-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .success-badge {
      width: 64px; height: 64px; border-radius: 32px;
      background: ${primary};
      display: flex; align-items: center; justify-content: center;
      transition: opacity 150ms ease;
    }

    /* Bottom */
    .bottom-bar {
      display: flex; justify-content: center; padding-bottom: 8px;
    }
    .brand-footer {
      display: flex; align-items: center; gap: 6px;
      margin-top: 16px; justify-content: center;
    }
    .brand-footer span { font-size: 12px; color: #9CA3AF; font-weight: 500; }
    .brand-footer--dark span { color: rgba(255,255,255,0.6); }
  `;
}
