# Pushwoosh OutSystems Plugin Changelog

This file contains changelog for all versions of the OutSystems plugin.

**IMPORTANT:** New releases should be added at the TOP (after this header), not at the bottom.
The order is: newest releases first, oldest releases last.

Versions are named `<upstream>-OS.<iteration>`: the Cordova plugin release this
build is based on, then the iteration of the OutSystems layer over it.

---

## 8.3.74-OS.1

### Features
- Rebased on the Cordova plugin 8.3.74: native SDKs updated to Android 6.12.0
  and iOS 7.2.5
- Inbox messages can now be shown as rich cards — a full-bleed banner, an image
  with title and text, a classic icon-title-text row, a swipeable carousel or a
  video poster that opens a full-screen player. The card is chosen by the
  `displayType` value in the message's custom data, and cards can carry inline
  action buttons (Android)
- Rich Media of an incoming push is prefetched in the background, so the
  notification is posted without waiting for the download, and content opened
  from the Inbox or a notification is reused instead of downloaded again
  (Android)

### Bug Fixes
- Fixed the PW_APPID and PW_API_TOKEN application preferences not reaching the
  iOS build when the build declared no entry for them: the key is now appended
  to the application target's Info.plist instead of being skipped, so the SDK
  starts with an application code and the device registers for pushes
- Fixed the Android build failing with a manifest merger error on a repeated
  build: cordova re-inserts its own meta-data node for a name whose value the
  hook had rewritten, leaving AndroidManifest.xml with two entries for the same
  name and different values. Duplicate entries are now folded into one
- Fixed an empty application code in the onDeviceReady block erasing the one
  the build had already written. On Android the value from AndroidManifest.xml
  is kept, and when there is none the action answers with an error instead of
  reporting success on an unconfigured SDK; the iOS side of the same fix now
  comes from the upstream plugin
- A preference that did not reach the native build is now reported in the build
  log with what was observed, instead of being skipped silently
- Fixed iOS crashes when plugin methods received an argument of an unexpected
  type (`setTags`, `setEmails`, `setUserId`, `setLanguage`, `postEvent` and
  others), a crash on an outgoing VoIP call placed without a contact
  identifier, a crash on a VoIP push carrying nested `null` values, an Android
  crash on an incoming call when a custom call event handler failed to
  initialize, and the plugin module throwing when imported outside a Cordova
  WebView
- Inbox messages delivered by push now stay in the list while the server
  finishes indexing them (Android)

---

## 8.3.72-OS.3

### Bug Fixes
- Fixed the PW_APPID and PW_API_TOKEN application preferences not reaching the
  iOS build: Pushwoosh_APPID stayed empty in the built Info.plist while the same
  preference was applied on Android, so the SDK started without an application
  code and the device never registered for pushes

---

## 8.3.72-OS.2

### Bug Fixes
- Fixed push delivery silently broken on Android: the Firebase and Huawei router
  services could be missing from the built AndroidManifest.xml, because both
  install hooks patched it asynchronously and overwrote each other
- A hook that cannot patch the manifest now fails the build instead of finishing
  without the service
- Reinstalling over an existing `platforms/android` replaces the router service
  declaration instead of keeping the stale one

---

## 8.3.72-OS.1

### Features
- Rebased on the Cordova plugin 8.3.72: Android SDK updated to 6.11.1, and the
  stale androidx.work pin is gone from the build

---

## 8.3.71-OS.2

### Bug Fixes
- Fixed Huawei push transport never activating. The HMS Push library
  (`com.huawei.hms:push`) was missing from the build, so on Huawei devices the
  SDK logged "Push Kit not integrated" and fell back to FCM, which does not
  work without Google services. The library is now part of the build; devices
  with HMS Core register through Huawei as intended

---

## 8.3.71-OS.1

### Features
- Rebased on the Cordova plugin 8.3.71: native SDKs updated to Android 6.11.0
  and iOS 7.2.4. The Android SDK includes a Huawei fix — a failure while
  fetching the HMS push token no longer falls through silently, which caused
  empty push tokens on Huawei devices

---

## 8.3.70-OS.11

### Features
- Added `getDiagnostics`: returns a JSON summary of the integration state —
  effective and built-in Application Code and where it came from, API token
  presence, HWID, push token, notification permission, services registered for
  FCM/HMS messaging events, plugin and native SDK versions. Attach its output
  to a support ticket instead of collecting device logs
- `PW_APPID` and `PW_API_TOKEN` can now also be set as application preferences
  in the Extensibility Configurations of the app itself. Plugin variables do
  not cross the module boundary in OutSystems; preferences do. When both are
  set, the preference wins

---

## 8.3.70-OS.10

### Bug Fixes
- Fixed the build failing with "one or more plugin variables are missing"
  (OS-MABS-PLG-40002) when `PW_APPID` or `PW_API_TOKEN` was not set. Both
  variables are optional again; use this version instead of 8.3.70-OS.9

---

## 8.3.70-OS.9

### Features
- Added `PW_APPID` and `PW_API_TOKEN` plugin variables. Set them in the
  Extensibility Configurations of your application and the build writes them
  into AndroidManifest.xml and Info.plist, so the SDK is configured even when
  it starts before JavaScript runs (for example, a push delivered while the
  app is not running). Variable names are case-sensitive. Initializing from
  JavaScript keeps working and still applies when both are set

---

## 8.3.70-OS.8

### Bug Fixes
- Fixed the initialization client action never finishing on iOS. `onDeviceReady`
  did not answer its callback, so the promise stayed pending and anything
  chained after initialization never ran. It now returns the notification
  status, and reports a missing application code instead of failing silently

---

## 8.3.70-OS.7

### Bug Fixes
- Fixed builds failing with an unexplained `TypeError [ERR_INVALID_ARG_TYPE]`.
  The hook that records the VoIP setting could abort the whole build, and the
  real reason was lost on the way out; it now reports the problem and lets the
  build continue

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
