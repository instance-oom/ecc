import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  outDir: 'lib',
  entries: [
    {
      name: 'index',
      input: 'src/index',
    },
  ],
  rollup: {
    emitCJS: true,
  },
  externals: ['big-integer', 'js-base64'],
});
