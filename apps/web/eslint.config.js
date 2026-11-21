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
    // shadcn components export variants alongside components.
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
