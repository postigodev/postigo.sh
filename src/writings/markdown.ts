import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export interface WritingHeading {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  text: string;
}

export interface RenderedWritingMarkdown {
  html: string;
  headings: WritingHeading[];
}

interface HastLikeNode {
  type?: unknown;
  tagName?: unknown;
  value?: unknown;
  properties?: Record<string, unknown>;
  children?: unknown[];
}

const writingSanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  clobberPrefix: 'writing-',
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      'dataFootnoteRef',
      ['ariaDescribedBy', 'footnote-label'],
    ],
    h2: [...(defaultSchema.attributes?.h2 ?? []), ['className', 'sr-only']],
    section: [
      ...(defaultSchema.attributes?.section ?? []),
      ['dataFootnotes', true],
      ['className', 'footnotes'],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};

function isNode(value: unknown): value is HastLikeNode {
  return typeof value === 'object' && value !== null;
}

function textContent(node: HastLikeNode): string {
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value;
  }

  return (node.children ?? [])
    .filter(isNode)
    .map(textContent)
    .join('');
}

function collectHeadings(node: HastLikeNode, headings: WritingHeading[]): void {
  const className = node.properties?.className;
  const isScreenReaderOnly =
    (Array.isArray(className) && className.includes('sr-only')) ||
    className === 'sr-only';
  if (
    node.type === 'element' &&
    typeof node.tagName === 'string' &&
    /^h[1-6]$/.test(node.tagName) &&
    !isScreenReaderOnly
  ) {
    const id = node.properties?.id;
    if (typeof id === 'string') {
      headings.push({
        depth: Number(node.tagName.slice(1)) as WritingHeading['depth'],
        id,
        text: textContent(node),
      });
    }
  }

  for (const child of node.children ?? []) {
    if (isNode(child)) {
      collectHeadings(child, headings);
    }
  }
}

export async function renderWritingMarkdown(
  markdown: string,
): Promise<RenderedWritingMarkdown> {
  const headings: WritingHeading[] = [];
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeSanitize, writingSanitizeSchema)
    .use(() => (tree) => {
      if (isNode(tree)) {
        collectHeadings(tree, headings);
      }
    })
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(result), headings };
}
