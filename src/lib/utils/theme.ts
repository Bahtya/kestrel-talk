type Theme = 'dark' | 'light';

function systemPreference(): Theme {
  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // matchMedia not available
  }
  return 'dark';
}

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || systemPreference();
}

const THEME_COLORS: Record<Theme, string> = { dark: '#0e1621', light: '#e8e0db' };

export function setTheme(theme: Theme): void {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme(): void {
  setTheme(getTheme());
}
