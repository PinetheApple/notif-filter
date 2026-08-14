# Changelog

## [0.0.7](https://github.com/PinetheApple/notif-filter/compare/v0.0.6...v0.0.7) (2026-08-14)


### Features

* add a script to build and install the current build on a device ([#80](https://github.com/PinetheApple/notif-filter/issues/80)) ([1bf9bbc](https://github.com/PinetheApple/notif-filter/commit/1bf9bbcba366aa3386aeb9349fe4a9049e8ed987))
* add regex help to the rule editor and settings ([#69](https://github.com/PinetheApple/notif-filter/issues/69)) ([c5b3edc](https://github.com/PinetheApple/notif-filter/commit/c5b3edcdbb2992de83bee73f029738d28afb7fec))
* replace Expo template art with a real app icon ([#86](https://github.com/PinetheApple/notif-filter/issues/86)) ([a2fb3c7](https://github.com/PinetheApple/notif-filter/commit/a2fb3c73c442cee7c2735ff1da48cb50e9182a9b))
* replace platform Alert dialogs with a themed dialog ([#87](https://github.com/PinetheApple/notif-filter/issues/87)) ([a12de8c](https://github.com/PinetheApple/notif-filter/commit/a12de8cfc8e1e553153fb24e9809ee8c175a6510))


### Bug Fixes

* bump drifted Expo packages to SDK 57 expectations ([#85](https://github.com/PinetheApple/notif-filter/issues/85)) ([bf4c2ce](https://github.com/PinetheApple/notif-filter/commit/bf4c2ce9b2cc602fbd19b6954e8252c9b239edc2))
* derive Android versionCode from expo.version ([#81](https://github.com/PinetheApple/notif-filter/issues/81)) ([59988f6](https://github.com/PinetheApple/notif-filter/commit/59988f69d60f538eb33a65b3a99f2b3e1266837c))
* keep rule editor inputs visible above the keyboard ([#72](https://github.com/PinetheApple/notif-filter/issues/72)) ([139fdc6](https://github.com/PinetheApple/notif-filter/commit/139fdc6af4db5b1ac81a37cbe1379e71bae7820e))
* let rule order decide precedence between allow and deny ([#65](https://github.com/PinetheApple/notif-filter/issues/65)) ([1ee1bda](https://github.com/PinetheApple/notif-filter/commit/1ee1bda1e41b07bf601dedb8145c8513f89916bf))
* unbreak CI and add a preflight script that runs every gate locally ([#78](https://github.com/PinetheApple/notif-filter/issues/78)) ([05debf9](https://github.com/PinetheApple/notif-filter/commit/05debf9f4a983d210fc30d656d867d2ffcc814b5))

## [0.0.6](https://github.com/PinetheApple/notif-filter/compare/v0.0.5...v0.0.6) (2026-08-10)


### Bug Fixes

* accept scheme-labelled signers in the APK signature check ([#62](https://github.com/PinetheApple/notif-filter/issues/62)) ([b4df3e4](https://github.com/PinetheApple/notif-filter/commit/b4df3e4f97a18e6a21e7484a9a1105a87ae4d024))

## [0.0.5](https://github.com/PinetheApple/notif-filter/compare/v0.0.4...v0.0.5) (2026-08-10)


### Bug Fixes

* make the APK signature check parse and explain itself ([#60](https://github.com/PinetheApple/notif-filter/issues/60)) ([959972b](https://github.com/PinetheApple/notif-filter/commit/959972b8a18a215734b983840e9fb96fd6521de1))

## [0.0.4](https://github.com/PinetheApple/notif-filter/compare/v0.0.3...v0.0.4) (2026-08-08)


### Features

* publish a signed APK with each release ([aa8d114](https://github.com/PinetheApple/notif-filter/commit/aa8d114dd7480fc4b05888e8bbdb4139ec93d51c)), closes [#40](https://github.com/PinetheApple/notif-filter/issues/40)


### Bug Fixes

* share one RuleStore between the JS bridge and the listener service ([b0eb633](https://github.com/PinetheApple/notif-filter/commit/b0eb633912e7cfb0cbf92934a65e001853b6bd99)), closes [#46](https://github.com/PinetheApple/notif-filter/issues/46)


### Performance

* shrink the release APK from 110.6 MB to 23.8 MB ([a435a03](https://github.com/PinetheApple/notif-filter/commit/a435a0332b305e26034cafb685b7336a504d6129)), closes [#48](https://github.com/PinetheApple/notif-filter/issues/48)

## [0.0.3](https://github.com/PinetheApple/notif-filter/compare/v0.0.2...v0.0.3) (2026-08-08)


### Build & Native

* bump org.json:json from 20231013 to 20260719 in /modules/notif-filter/android ([93ef2d8](https://github.com/PinetheApple/notif-filter/commit/93ef2d8fa98727eb481a8df7d44634ee29690cf2))
* bump org.robolectric:robolectric from 4.14.1 to 4.16.1 in /modules/notif-filter/android ([a2678a5](https://github.com/PinetheApple/notif-filter/commit/a2678a54b282077f34cf9f90f5bc16597aa96570))

## [0.0.2](https://github.com/PinetheApple/notif-filter/compare/v0.0.1...v0.0.2) (2026-08-08)


### Bug Fixes

* give release-please a scoped token so it can open its PR ([8d8ee9b](https://github.com/PinetheApple/notif-filter/commit/8d8ee9bdf7e9dc0e11162a81c6cef7b9143684c8)), closes [#32](https://github.com/PinetheApple/notif-filter/issues/32)
* stop history noise, recover missed notifications, fix rule UX ([1c7fc1c](https://github.com/PinetheApple/notif-filter/commit/1c7fc1c25a814b8498a066b072f893c44cdb61ba))
