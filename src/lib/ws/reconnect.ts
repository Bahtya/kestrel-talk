const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
const MULTIPLIER = 2;

export class ReconnectStrategy {
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  schedule(callback: () => void): void {
    this.cancel();
    const baseDelay = Math.min(BASE_DELAY * Math.pow(MULTIPLIER, this.attempt), MAX_DELAY);
    const jitter = baseDelay * (0.5 + Math.random() * 0.5);
    this.timer = setTimeout(() => {
      this.attempt++;
      callback();
    }, jitter);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  reset(): void {
    this.cancel();
    this.attempt = 0;
  }

  get currentDelay(): number {
    return Math.min(BASE_DELAY * Math.pow(MULTIPLIER, this.attempt), MAX_DELAY);
  }
}
