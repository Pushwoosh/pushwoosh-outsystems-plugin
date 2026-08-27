// Reads PW_APPID / PW_API_TOKEN from config.xml preferences and writes them
// into the native build files.
//
// Plugin variables only work in the Extensibility Configurations of the module
// that declares the plugin: OutSystems does not merge variables from a consumer
// app into a producer's plugin entry. Application-level "preferences" do reach
// config.xml on every build, so this hook is the reader that makes them count.
// A preference wins over a plugin variable — it is the value closest to the app.
//
// Never fails the build: every problem is reported and skipped.

var fs = require("fs");
var path = require("path");

var ENTRIES = [
    { pref: "pw_appid", manifestKey: "com.pushwoosh.appid", plistKey: "Pushwoosh_APPID" },
    { pref: "pw_api_token", manifestKey: "com.pushwoosh.apitoken", plistKey: "Pushwoosh_API_TOKEN" },
];

function log(message) {
    console.log("[PUSHWOOSH PREFERENCES] " + message);
}

// Preference names are matched case-insensitively, the way cordova reads them.
function readPreferences(projectRoot) {
    var values = {};
    var xml;
    try {
        xml = fs.readFileSync(path.join(projectRoot, "config.xml"), "utf8");
    } catch (error) {
        log("config.xml not readable: " + error.message);
        return values;
    }
    (xml.match(/<preference\b[^>]*>/g) || []).forEach(function (tag) {
        var name = (tag.match(/\bname\s*=\s*"([^"]*)"/) || [])[1];
        var value = (tag.match(/\bvalue\s*=\s*"([^"]*)"/) || [])[1];
        if (name && value !== undefined) {
            values[name.toLowerCase()] = value;
        }
    });
    return values;
}

function replaceValue(filePath, pattern, render, label) {
    var content = fs.readFileSync(filePath, "utf8");
    if (!pattern.test(content)) {
        log(label + " not found in " + path.basename(filePath) + " — skipped");
        return;
    }
    content = content.replace(pattern, render);
    fs.writeFileSync(filePath, content, "utf8");
    log(label + " written to " + path.basename(filePath));
}

function updateAndroid(projectRoot, entry, value) {
    var manifestPath = path.join(projectRoot, "platforms/android/app/src/main/AndroidManifest.xml");
    if (!fs.existsSync(manifestPath)) return;
    var key = entry.manifestKey.replace(/\./g, "\\.");
    replaceValue(
        manifestPath,
        new RegExp('(<meta-data[^>]*android:name="' + key + '"[^>]*android:value=")[^"]*(")'),
        function (match, head, tail) {
            return head + value + tail;
        },
        entry.manifestKey
    );
}

function updateIos(projectRoot, entry, value) {
    var iosRoot = path.join(projectRoot, "platforms/ios");
    if (!fs.existsSync(iosRoot)) return;
    fs.readdirSync(iosRoot).forEach(function (dir) {
        var plistPath = path.join(iosRoot, dir, dir + "-Info.plist");
        if (!fs.existsSync(plistPath)) return;
        replaceValue(
            plistPath,
            // cordova writes an empty value as a self-closing <string/>, never as <string></string>
            new RegExp("(<key>" + entry.plistKey + "</key>\\s*)(?:<string>[^<]*</string>|<string\\s*/>)"),
            function (match, head) {
                return head + "<string>" + value + "</string>";
            },
            entry.plistKey
        );
    });
}

module.exports = function (context) {
    try {
        var projectRoot = context.opts.projectRoot;
        var preferences = readPreferences(projectRoot);
        ENTRIES.forEach(function (entry) {
            var value = (preferences[entry.pref] || "").trim();
            if (!value) return;
            updateAndroid(projectRoot, entry, value);
            updateIos(projectRoot, entry, value);
        });
    } catch (error) {
        log("failed, leaving the build untouched: " + error.message);
    }
};
