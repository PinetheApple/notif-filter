// eslint-config-expo carries the TS/React/hooks/import rules and no formatting rules, so
// it composes with prettier without eslint-config-prettier.
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig, globalIgnores } = require('eslint/config');
const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');

module.exports = defineConfig([
  globalIgnores(['android/', 'ios/', 'dist/', 'web-build/', 'expo-env.d.ts']),
  expoConfig,
  {
    // expo's config leaves import/resolver on the node resolver, which cannot follow the
    // `@/*` tsconfig paths; the resolver-next interface is the supported way to override it.
    settings: {
      'import/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.json' })],
    },
  },
]);
