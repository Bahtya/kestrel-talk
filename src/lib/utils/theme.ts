type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'dark';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme(): void {
  setTheme(getTheme());
}
