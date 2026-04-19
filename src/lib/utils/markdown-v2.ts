import { Marked, type TokenizerAndRendererExtension, type Tokens } from 'marked';

// Telegram MarkdownV2 syntax extensions:
// __underline__ → <u>underline</u>
// ~strikethrough~ → <s>strikethrough</s>
// ||spoiler|| → <span class="spoiler">spoiler</span>

const underlineExtension: TokenizerAndRendererExtension = {
  name: 'underline',
  level: 'inline',
  start(src: string) {
    return src.indexOf('__');
  },
  tokenizer(src: string): Tokens.Generic | undefined {
    const match = src.match(/^__([^_\n]+?)__(?!_)/);
    if (match) {
      return { type: 'underline', raw: match[0], text: match[1] } as Tokens.Generic;
    }
    return undefined;
  },
  renderer(token: Tokens.Generic): string {
    return `<u>${token.text}</u>`;
  },
};

const strikethroughExtension: TokenizerAndRendererExtension = {
  name: 'strikethrough',
  level: 'inline',
  start(src: string) {
    return src.indexOf('~');
  },
  tokenizer(src: string): Tokens.Generic | undefined {
    const match = src.match(/^~([^~\n]+?)~/);
    if (match) {
      return { type: 'strikethrough', raw: match[0], text: match[1] } as Tokens.Generic;
    }
    return undefined;
  },
  renderer(token: Tokens.Generic): string {
    return `<s>${token.text}</s>`;
  },
};

const spoilerExtension: TokenizerAndRendererExtension = {
  name: 'spoiler',
  level: 'inline',
  start(src: string) {
    return src.indexOf('||');
  },
  tokenizer(src: string): Tokens.Generic | undefined {
    const match = src.match(/^\|\|([^|\n]+?)\|\|/);
    if (match) {
      return { type: 'spoiler', raw: match[0], text: match[1] } as Tokens.Generic;
    }
    return undefined;
  },
  renderer(token: Tokens.Generic): string {
    return `<span class="spoiler">${token.text}</span>`;
  },
};

export const markdownV2 = new Marked({
  gfm: true,
  breaks: true,
  extensions: [underlineExtension, strikethroughExtension, spoilerExtension],
  renderer: {
    link({ href, title, text }) {
      const t = title ? ` title="${title}"` : '';
      return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

export interface V2ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMarkdownV2(content: string): V2ValidationResult {
  const errors: string[] = [];

  // Check for unbalanced __ (underline)
  const underlineMatches = content.match(/(?<!_)__(?!_)/g);
  if (underlineMatches && underlineMatches.length % 2 !== 0) {
    errors.push('Unbalanced __ underline markers');
  }

  // Check for unbalanced || (spoiler)
  const spoilerMatches = content.match(/\|\|/g);
  if (spoilerMatches && spoilerMatches.length % 2 !== 0) {
    errors.push('Unbalanced || spoiler markers');
  }

  // Check for unbalanced ~ (strikethrough)
  const tildeMatches = content.match(/~/g);
  if (tildeMatches && tildeMatches.length % 2 !== 0) {
    errors.push('Unbalanced ~ strikethrough markers');
  }

  // Check for unescaped special chars (Telegram requirement: _ * [ ] ( ) ~ ` > # + - = | { } . ! must be escaped)
  // For our purposes, we're lenient - only check for clearly broken syntax

  return { valid: errors.length === 0, errors };
}
