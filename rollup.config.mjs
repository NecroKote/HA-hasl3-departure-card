import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    entryFileNames: 'hasl4-departure-card.js',
    chunkFileNames: 'hasl4-departure-card-editor.js',
  },
  plugins: [
    resolve(),
    esbuild({
      target: browserslistToEsbuild(),
      supported: {
        'destructuring': true,
      },
      minify: true,
    }),
  ],
};
