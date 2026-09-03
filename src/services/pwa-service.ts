import { session } from '../core/session';
import { appEvents } from '../core/event-bus';

export class PwaService {
  private waitingWorker: ServiceWorker | null = null;

  init(): void {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        this.registerServiceWorker();
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Progressive File Handling API
    if ('launchQueue' in window && 'files' in (window as any).LaunchParams.prototype) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (launchParams.files && launchParams.files.length > 0) {
          const fileHandle = launchParams.files[0];
          const file = await fileHandle.getFile();
          appEvents.emit('app:openFile', file);
        }
      });
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const reg = await navigator.serviceWorker.ready;

      // Check if update already waiting
      if (reg.waiting) {
        this.handleWaitingWorker(reg.waiting);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.handleWaitingWorker(newWorker);
            }
          });
        }
      });
    } catch (err) {
      console.warn('Service worker registration skipped or failed:', err);
    }
  }

  private handleWaitingWorker(worker: ServiceWorker): void {
    this.waitingWorker = worker;
    // Show update modal
    session.setModal('updatePrompt');
  }

  applyUpdate(): void {
    if (this.waitingWorker) {
      this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }
}

export const pwaService = new PwaService();
