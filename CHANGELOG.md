# Pushwoosh OutSystems Plugin Changelog

This file contains changelog for all versions of the OutSystems plugin.

**IMPORTANT:** New releases should be added at the TOP (after this header), not at the bottom.
The order is: newest releases first, oldest releases last.

Versions are named `<upstream>-OS.<iteration>`: the Cordova plugin release this
build is based on, then the iteration of the OutSystems layer over it.

---

## 8.3.70-OS.6

### Bug Fixes
- Fixed Android device registration failing with "Failed to retrieve token. Is
  firebase configured correctly?". The Firebase configuration uploaded with the
  module was not being applied to the build

---

## 8.3.70-OS.5

### Bug Fixes
- Removed a manifest entry that made the SDK log a missing VoIP class on every
  application launch

---

## 8.3.70-OS.4

### Bug Fixes
- Removed the Cordova plugin's issue templates, which survived the previous
  release: the publish step spared them along with `.git`

---

## 8.3.70-OS.3

### Improvements
- Releases now carry release notes
- Removed files from the published plugin that are not part of an application

---

## 8.3.70-OS.2

### New Features
- First release built from an upstream Cordova plugin release rather than a
  long-lived branch. Everything the Cordova plugin gained since 8.3.38 is now
  available in OutSystems: GDPR methods, the full Message Inbox API, VoIP
  support, and Pushwoosh Android SDK 6.9.6 in place of 6.7.24

### Bug Fixes
- Fixed Android builds failing on current versions of MABS

### Improvements
- Documented OutSystems installation, the module resource that carries the
  Firebase configuration, and the differences from the Cordova plugin
