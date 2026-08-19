# Pushwoosh OutSystems Plugin Changelog

This file contains changelog for all versions of the OutSystems plugin.

**IMPORTANT:** New releases should be added at the TOP (after this header), not at the bottom.
The order is: newest releases first, oldest releases last.

Versions are named `<upstream>-OS.<iteration>`: the Cordova plugin release this
build is based on, then the iteration of the OutSystems layer over it.

---

## 8.3.70-OS.5

### Bug Fixes
- Fixed Android registration failing in MABS with `Failed to retrieve token. Is
  firebase configured correctly?`. The plugin relied on cordova-android applying
  the Google Services plugin from the `GradlePluginGoogleServicesEnabled`
  preference, which does not reach MABS, so `google-services.json` never became
  application resources and Firebase could not issue a token. The plugin applies
  it itself again, without the isolated buildscript that made the old gradle file
  fail on current toolchains
- Removed the `com.pushwoosh.CALL_EVENT_LISTENER` manifest entry. It named a
  class from the VoIP source set, which only reaches the build when VoIP is
  enabled, so the SDK reported a missing class on every launch

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
