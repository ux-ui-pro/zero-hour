import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';

const cssPlugin: Plugin = {
  name: 'zero-hour:css',
  async load(id: string) {
    if (!id.includes('zero-hour.css') || !id.includes('?raw')) return null;

    const file = id.split('?', 1)[0];
    const input = await readFile(file);
    const result = transform({
      filename: file,
      code: input,
      minify: true,
    });

    const minifiedCssText = Buffer.from(result.code).toString('utf8');
    return `export default ${JSON.stringify(minifiedCssText)};`;
  },
  async generateBundle(this) {
    const file = resolve(process.cwd(), 'src', 'zero-hour.css');
    const input = await readFile(file);
    const result = transform({
      filename: file,
      code: input,
      minify: true,
    });

    this.emitFile({
      type: 'asset',
      fileName: 'zero-hour.css',
      source: Buffer.from(result.code).toString('utf8'),
    });
  },
};

export default defineConfig(({ command }) => ({
  plugins:
    command === 'build'
      ? [
          cssPlugin,
          dts({
            outDir: 'dist',
            insertTypesEntry: true,
            entryRoot: 'src',
            cleanVueFileName: true,
          }),
        ]
      : [cssPlugin],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ZeroHour',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'index.[ext]',
      },
    },
  },
}));
