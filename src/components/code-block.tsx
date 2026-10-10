'use client';

// Syntax-highlighted code (JSON by default). Uses the Prism "light" build with
// only the grammars we register, and a theme built from the palette's CSS
// variables so it follows light/dark mode automatically.

import type { CSSProperties } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { cn } from '@/lib/utils';

SyntaxHighlighter.registerLanguage('json', json);

const theme: Record<string, CSSProperties> = {
  'code[class*="language-"]': { color: 'var(--foreground)', fontFamily: 'var(--font-geist-mono), monospace' },
  'pre[class*="language-"]': { color: 'var(--foreground)', fontFamily: 'var(--font-geist-mono), monospace' },
  property: { color: 'var(--trace)', fontWeight: 600 },
  string: { color: 'var(--success)' },
  number: { color: 'var(--chart-4)' },
  boolean: { color: 'var(--chart-4)', fontWeight: 600 },
  null: { color: 'var(--muted-foreground)', fontStyle: 'italic' },
  keyword: { color: 'var(--muted-foreground)', fontStyle: 'italic' },
  punctuation: { color: 'var(--muted-foreground)' },
  operator: { color: 'var(--muted-foreground)' },
};

interface CodeBlockProps {
  /** A string of code, or any value to pretty-print as JSON */
  value: unknown;
  language?: 'json';
  className?: string;
  /** Wrap long lines instead of scrolling horizontally */
  wrap?: boolean;
}

export function CodeBlock({ value, language = 'json', className, wrap = false }: CodeBlockProps) {
  const code = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <SyntaxHighlighter
      language={language}
      style={theme}
      wrapLongLines={wrap}
      className={cn('!m-0 rounded-lg !bg-muted/50 text-xs leading-relaxed', className)}
      customStyle={{ padding: '0.75rem 1rem', background: undefined }}
      codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono), monospace' } }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
