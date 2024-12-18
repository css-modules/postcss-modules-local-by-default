# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [4.2.0](https://github.com/postcss-modules-local-by-default/compare/v4.1.1...v4.2.0) - 2024-12-11

- feat: add support a `/* cssmodules-pure-no-check */` comment

## [4.1.0](https://github.com/postcss-modules-local-by-default/compare/v4.0.5...v4.1.1) - 2024-11-11

- feat: add `global()` and `local()` for animations
- feat: add pure ignore comment
- fix: css nesting and pure mode

## [4.0.5](https://github.com/postcss-modules-local-by-default/compare/v4.0.4...v4.0.5) - 2024-04-03

### Fixes

- don't break the `@scope` at-rule without params

## [4.0.4](https://github.com/postcss-modules-local-by-default/compare/v4.0.3...v4.0.4) - 2024-01-17

### Fixes

- handle `@scope` at-rule
- css nesting
- do not tread negative values as identifiers in the animation shorthand

## [4.0.3](https://github.com/postcss-modules-local-by-default/compare/v4.0.2...v4.0.3) - 2023-05-23

### Fixes

- fix: do not localize `animation-name` property with var and env functions

## [4.0.2](https://github.com/postcss-modules-local-by-default/compare/v4.0.1...v4.0.2) - 2023-05-23

### Fixes

- don't handle identifiers in nested function for the `animation` property

## [4.0.1](https://github.com/postcss-modules-local-by-default/compare/v4.0.0...v4.0.1) - 2023-05-19

### Fixes

- don't handle global values in `animation` and `animation-name` properties
- handle all possible identifiers in `animation` and `animation-name` properties
- fix bug with nested `:global` and `:local` in pseudo selectors

## [4.0.0](https://github.com/postcss-modules-local-by-default/compare/v4.0.0-rc.4...v4.0.0) - 2020-10-13

### Fixes

- compatibility with plugins other plugins

## [4.0.0-rc.4](https://github.com/postcss-modules-local-by-default/compare/v4.0.0-rc.3...v4.0.0-rc.4) - 2020-10-11

### Fixes

- compatibility with plugins other plugins

## [4.0.0-rc.3](https://github.com/postcss-modules-local-by-default/compare/v4.0.0-rc.2...v4.0.0-rc.3) - 2020-10-08

### Fixes

- compatibility with plugins other plugins

## [4.0.0-rc.2](https://github.com/postcss-modules-local-by-default/compare/v4.0.0-rc.1...v4.0.0-rc.2) - 2020-10-08

### BREAKING CHANGE

- minimum supported `postcss` version is `^8.1.0`

### Fixes

- minimum supported `Node.js` version is `^10 || ^12 || >= 14`
- compatibility with PostCSS 8

## [4.0.0-rc.1](https://github.com/postcss-modules-local-by-default/compare/v4.0.0-rc.0...v4.0.0-rc.1) - 2020-09-22

### BREAKING CHANGE

- update `icss-utils` for PostCSS 8 compatibility

## [4.0.0-rc.0](https://github.com/postcss-modules-local-by-default/compare/v3.0.3...4.0.0-rc.0) - 2020-09-18

### BREAKING CHANGE

- minimum supported `Node.js` version is `>= 10.13.0 || >= 12.13.0 || >= 14`
- minimum supported `postcss` version is `^8.0.3`
- `postcss` was moved to `peerDependencies`, you need to install `postcss` in your project before use the plugin

## [3.0.3](https://github.com/postcss-modules-local-by-default/compare/v3.0.2...v3.0.3) - 2020-07-25

### Fixed

- treat `:import` and `:export` statements as pure

## [3.0.2](https://github.com/postcss-modules-local-by-default/compare/v3.0.1...v3.0.2) - 2019-06-05

### Fixed

- better handle invalid syntax

## [3.0.1](https://github.com/postcss-modules-local-by-default/compare/v3.0.0...v3.0.1) - 2019-05-16

### Fixed

- adds safety check before accessing "rule parent"

## [3.0.0](https://github.com/postcss-modules-local-by-default/compare/v2.0.6...v3.0.0) - 2019-05-07

### Features

- don't localize imported values in selectors

### Changes

- don't localize imported values in selectors

## [2.0.6](https://github.com/postcss-modules-local-by-default/compare/v2.0.5...v2.0.6) - 2019-03-05

### Fixed

- handles properly selector with escaping characters (like: `.\31 a2b3c { color: red }`)

## [2.0.5](https://github.com/postcss-modules-local-by-default/compare/v2.0.4...v2.0.5) - 2019-02-06

### Fixed

- Path to `index.js`

## [2.0.4](https://github.com/postcss-modules-local-by-default/compare/v2.0.3...v2.0.4) - 2019-01-04

### Fixed

- Inappropriate modification of `steps` function arguments

## [2.0.3](https://github.com/postcss-modules-local-by-default/compare/v2.0.2...v2.0.3) - 2018-12-21

### Fixed

- Don't modify inappropriate animation keywords

## [2.0.2](https://github.com/postcss-modules-local-by-default/compare/v2.0.1...v2.0.2) - 2018-12-05

### Fixed

- Don't break unicode characters.

## [2.0.1](https://github.com/postcss-modules-local-by-default/compare/v2.0.0...v2.0.1) - 2018-11-23

### Fixed

- Handle uppercase `keyframes` at rule.

## [2.0.0](https://github.com/postcss-modules-local-by-default/compare/v1.3.1...v2.0.0) - 2018-11-23

### Changed

- Drop support `nodejs@4`.
- Update `postcss` version to `7`.

## [0.0.11](https://github.com/postcss-modules-local-by-default/compare/v0.0.10...v0.0.11) - 2015-07-19

### Fixed

- Localisation of animation properties.

## [0.0.10](https://github.com/postcss-modules-local-by-default/compare/v0.0.9...v0.0.10) - 2015-06-17

### Added

- Localised at-rules.

## [0.0.9](https://github.com/postcss-modules-local-by-default/compare/v0.0.8...v0.0.9) - 2015-06-12

### Changed

- Using global selectors outside of a global context no longer triggers warnings. Instead, this functionality will be provided by a CSS Modules linter.

### Fixed

- Keyframe rules.

## [0.0.8](https://github.com/postcss-modules-local-by-default/compare/v0.0.7...v0.0.8) - 2015-06-11

### Added

- Pure mode where only local scope is allowed.

### Changed

- Using global selectors outside of a global context now triggers warnings.

## [0.0.7](https://github.com/postcss-modules-local-by-default/compare/v0.0.6...v0.0.7) - 2015-05-30

### Changed

- Migrated to `css-selector-tokenizer`.

## [0.0.6](https://github.com/postcss-modules-local-by-default/compare/v0.0.5...v0.0.6) - 2015-05-28

### Changed

- Renamed project to `postcss-modules-local-by-default`.

## [0.0.5](https://github.com/postcss-modules-local-by-default/compare/v0.0.4...v0.0.5) - 2015-05-22

### Added

- Support for css-loader [inheritance](https://github.com/webpack/css-loader#inheriting) and [local imports](https://github.com/webpack/css-loader#importing-local-class-names).

## [0.0.4](https://github.com/postcss-modules-local-by-default/compare/v0.0.3...v0.0.4) - 2015-05-22

### Changed

- Hide global leak detection behind undocumented `lint` option until it's more robust.

## [0.0.3](https://github.com/postcss-modules-local-by-default/compare/v0.0.2...v0.0.3) - 2015-05-22

### Changed

- Transformer output now uses the new `:local(.identifier)` syntax.

### Added

- Simple global leak detection. Non-local selectors like `input{}` and `[data-foobar]` now throw when not marked as global.

## [0.0.2](https://github.com/postcss-modules-local-by-default/compare/v0.0.1...v0.0.2) - 2015-05-14

### Added

- Support for global selectors appended directly to locals, e.g. `.foo:global(.bar)`

## 0.0.1 - 2015-05-12

### Added

- Automatic local classes
- Explicit global selectors with `:global`
