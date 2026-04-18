import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

const CORE_LANGS = [
  'javascript', 'typescript', 'python', 'rust', 'plaintext',
  'css', 'html', 'json', 'bash', 'sql', 'go', 'java', 'c', 'cpp',
];

const DARK_THEME = 'vitesse-dark';
const LIGHT_THEME = 'vitesse-light';

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) return highlighterInstance;

  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = (async () => {
    const instance = await createHighlighter({
      themes: [DARK_THEME, LIGHT_THEME],
      langs: CORE_LANGS,
    });
    highlighterInstance = instance;
    return instance;
  })();

  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const resolvedLang = highlighter.getLoadedLanguages().includes(lang) ? lang : 'plaintext';
    return highlighter.codeToHtml(code, {
      lang: resolvedLang,
      themes: { light: LIGHT_THEME, dark: DARK_THEME },
      defaultColor: false,
      cssVariablePrefix: '--shiki-',
    });
  } catch {
    return escapeHtml(code);
  }
}

export async function loadLanguage(lang: string): Promise<void> {
  try {
    const highlighter = await getHighlighter();
    if (!highlighter.getLoadedLanguages().includes(lang)) {
      await highlighter.loadLanguage(lang as any);
    }
  } catch {
    // Language not available, will fall back to plaintext
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
