import pluginQuery from '@tanstack/eslint-plugin-query';
import { config } from '@repo/eslint-config/react';

export default [
  ...config,
  ...pluginQuery.configs['flat/recommended'],
  {
    // Keep each query's key and fetch together in queryOptions (docs/architecture.md).
    rules: { '@tanstack/query/prefer-query-options': 'error' },
  },
  { ignores: ['src/routeTree.gen.ts'] },
  {
    // mapcn keeps the latest props in refs on purpose; vendored, so leave it as shipped.
    files: ['src/components/ui/map.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // shadcn components export variants alongside components.
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // reui components are vendored; leave them as shipped.
    files: ['src/components/reui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-irregular-whitespace': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];
