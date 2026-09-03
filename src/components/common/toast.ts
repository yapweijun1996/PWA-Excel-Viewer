let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'status');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: string, duration = 2500): void {
  if (typeof document === 'undefined') return;

  const c = getContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  c.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease';
    setTimeout(() => {
      if (c.contains(toast)) {
        c.removeChild(toast);
      }
    }, 200);
  }, duration);
}
