# Changelog

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
