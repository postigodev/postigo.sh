import { describe, expect, it } from 'vitest';
import { renderWritingMarkdown } from './markdown';

describe('renderWritingMarkdown', () => {
  it('renders GFM structures, footnotes, and stable heading records', async () => {
    const result = await renderWritingMarkdown(`
# Hello, world
## Hello, world

> quoted

- one
- two

| Name | Value |
| --- | --- |
| A | 1 |

~~removed~~ and a note.[^1]

[^1]: Footnote text.
`);

    expect(result.headings).toEqual([
      { depth: 1, id: 'writing-hello-world', text: 'Hello, world' },
      { depth: 2, id: 'writing-hello-world-1', text: 'Hello, world' },
    ]);
    expect(result.html).toContain('<blockquote>');
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<del>removed</del>');
    expect(result.html).toContain('data-footnotes');
  });

  it('renders fenced code without executing or interpreting it', async () => {
    const { html } = await renderWritingMarkdown(
      '```js\nalert("still text")\n```',
    );
    expect(html).toContain('<pre><code class="language-js">');
    expect(html).toContain('alert("still text")');
  });

  it('drops raw HTML and strips unsafe URL protocols', async () => {
    const { html } = await renderWritingMarkdown(`
<script>alert('xss')</script>
<img src=x onerror=alert(1)>

[unsafe](javascript:alert(1))
[safe](https://example.com)
`);

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('onerror');
    expect(html).toContain('href="https://example.com"');
  });
});
