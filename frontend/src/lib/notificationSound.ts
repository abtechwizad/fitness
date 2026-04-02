/**
 * Notification sound using Web Audio API. Browsers block audio until user interaction,
 * so call unlockNotificationSound() on first click (e.g. in AppLayout).
 */
const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
let ctx: AudioContext | null = null;

export function unlockNotificationSound(): void {
  if (typeof AudioCtx === "undefined") return;
  try {
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
  } catch {}
}

export function playNotificationSound(): void {
  if (typeof AudioCtx === "undefined") return;
  try {
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().then(() => playTones()).catch(() => {});
    else playTones();
  } catch {}
}

function playTones(): void {
  if (!ctx) return;
  const play = (freq: number, startTime: number, duration: number) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };
  play(880, 0, 0.12);
  play(1100, 0.15, 0.15);
}
