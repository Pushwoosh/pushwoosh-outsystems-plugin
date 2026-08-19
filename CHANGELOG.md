# Pushwoosh OutSystems Plugin Changelog

This file contains changelog for all versions of the OutSystems plugin.

**IMPORTANT:** New releases should be added at the TOP (after this header), not at the bottom.
The order is: newest releases first, oldest releases last.

Versions are named `<upstream>-OS.<iteration>`: the Cordova plugin release this
build is based on, then the iteration of the OutSystems layer over it.

---

## 8.3.70-OS.4

### Bug Fixes
- Removed the Cordova plugin's issue templates, which survived the previous
  release: the publish step spared them along with `.git`

---

## 8.3.70-OS.3

### Improvements
- Releases on GitHub now carry the changelog entry for the version, instead of
  being a bare tag
- Removed files that never reach a device from the published plugin: the issue
  templates (they point at the Cordova plugin's tracker), `.npmignore`, and the
  Jasmine test scaffolding. The VoIP install hooks under `spec/` stay

---

## 8.3.70-OS.2

### New Features
- First release built from an upstream Cordova plugin release rather than a
  long-lived branch. Everything the Cordova plugin gained since 8.3.38 is now
  available in OutSystems: GDPR methods, the full Message Inbox API, VoIP
  support, and Pushwoosh Android SDK 6.9.6 in place of 6.7.24

### Bug Fixes
- Fixed Android builds failing on current toolchains. The Google Services gradle
  plugin was loaded from a buildscript of its own, where the Android Gradle
  Plugin classes are not visible, and applying it failed with
  `NoClassDefFoundError: com/android/build/api/variant/Variant`

### Improvements
- Removed the `cordova-androidx-build` dependency; cordova-android sets
  `useAndroidX` and `enableJetifier` itself
- README now documents OutSystems installation, the module resource carrying the
  Firebase configuration, and how this plugin differs from the Cordova one
