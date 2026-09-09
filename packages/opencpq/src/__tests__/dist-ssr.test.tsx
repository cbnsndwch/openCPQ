// @vitest-environment node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

type DistModule = typeof import('../../dist/index.js');

const packageRoot = resolve(import.meta.dirname, '../..');
const distEntry = resolve(packageRoot, 'dist/index.js');

let built: DistModule;

beforeAll(async () => {
    execFileSync('pnpm', ['run', 'build'], { cwd: packageRoot, stdio: 'inherit' });
    built = await import(pathToFileURL(distEntry).href);
});

describe('built ESM package SSR safety', () => {
    it('imports dist/index.js and renders a group without require()', () => {
        const { t, Type, rootPath, Problems } = built;
        const schema = t.group([t.member('product', 'Product', t.string())]);
        expect(schema).toBeInstanceOf(Type);

        const node = schema.makeNode({
            path: rootPath,
            problems: new Problems(),
            value: { product: 'Laptop' },
            updateTo: () => {}
        });
        const html = renderToStaticMarkup(<>{node.render()}</>);

        expect(html).toContain('cpq-group');
        expect(html).toContain('Laptop');
    });
});
