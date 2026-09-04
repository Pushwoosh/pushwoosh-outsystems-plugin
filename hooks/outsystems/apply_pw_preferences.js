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

// A miss says what was observed, never why: the hook ships inside the same
// plugin version as the entries it writes into, so it cannot tell a stale
// build from a file that is not the target it was expected to be.
function warn(label, problem) {
    log("WARNING: " + label + " NOT APPLIED — " + problem + ". Report this with the build log.");
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

function escapeForRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Every spelling cordova-ios may have used for the application's own target
// directory: the short name when config.xml carries one, the element text
// otherwise, each also NFD-normalised the way cordova-ios normalises it.
// The list can still miss a project, which is why updateIos warns whenever a
// pass wrote the value nowhere.
function mainTargetNames(projectRoot) {
    var names = [];
    var tag;
    try {
        tag = (fs.readFileSync(path.join(projectRoot, "config.xml"), "utf8").match(/<name\b[^>]*>[^<]*<\/name>/) || [])[0];
    } catch (error) {
        return names;
    }
    if (!tag) return names;

    [(tag.match(/\bshort\s*=\s*"([^"]*)"/) || [])[1], (tag.match(/>([^<]*)</) || [])[1]].forEach(function (name) {
        name = (name || "").trim();
        if (!name) return;
        names.push(name);
        if (typeof name.normalize === "function") names.push(name.normalize("NFD"));
    });
    return names;
}

// Writes the value into a plist and returns null, or the one reason it could
// not: "no-entry", nothing in the file matched the pattern. The caller decides
// what that means — a key in an unrecognised shape and a key that is absent
// need different answers, and only the caller can tell them apart.
function applyValue(filePath, pattern, render) {
    var content = fs.readFileSync(filePath, "utf8");
    if (!pattern.test(content)) {
        return "no-entry";
    }
    fs.writeFileSync(filePath, content.replace(pattern, render), "utf8");
    return null;
}

// Appends the pair a missing config-file should have put there. Only ever used
// on the application's own target, and only when the key is absent altogether:
// an extension target legitimately carries no entry, and appending next to a
// key that is already there would leave the file with a duplicate.
function insertPlistEntry(filePath, plistKey, value) {
    var content = fs.readFileSync(filePath, "utf8");
    var at = content.lastIndexOf("</dict>");
    if (at === -1) {
        return "no </dict> to append the entry to in " + path.basename(filePath);
    }
    var pair = "\t<key>" + plistKey + "</key>\n\t<string>" + value + "</string>\n";
    fs.writeFileSync(filePath, content.slice(0, at) + pair + content.slice(at), "utf8");
    return null;
}

// cordova does not re-apply plugin.xml on every build: it records the node it
// inserted — with the plugin variable already substituted, so a lone space when
// the value is meant to come from a preference — and re-inserts that exact node
// on any later prepare whose manifest no longer contains it. Rewriting the
// value in place is precisely such a change, so a second prepare adds another
// meta-data for the same name, and the manifest merger fails the Android build
// on two entries with the same name and different values.
//
// Hence: rewrite every occurrence and fold them into one. Each prepare is then
// self-correcting — cordova adds its node back, the hook folds it in again —
// and the manifest stays at a single entry however many times a build system
// prepares.
function updateAndroid(projectRoot, entry, value) {
    var manifestPath = path.join(projectRoot, "platforms/android/app/src/main/AndroidManifest.xml");
    if (!fs.existsSync(manifestPath)) return;

    var fileName = path.basename(manifestPath);
    var key = escapeForRegExp(entry.manifestKey);
    var content = fs.readFileSync(manifestPath, "utf8");
    var node = new RegExp('[ \\t]*<meta-data\\b[^>]*android:name="' + key + '"[^>]*/>[ \\t]*\\r?\\n?', "g");

    var nodes = content.match(node);
    if (!nodes) {
        // cordova only ever writes the self-closing form, so the long one means
        // someone edited the manifest by hand. Say which of the two it is, the
        // way the plist side does.
        var declaresKey = new RegExp('<meta-data\\b[^>]*android:name="' + key + '"');
        warn(
            entry.manifestKey,
            declaresKey.test(content)
                ? "the entry for it in " + fileName + " is in a shape this hook does not recognise"
                : "no entry for it in " + fileName
        );
        return;
    }
    if (
        !nodes.every(function (found) {
            return /android:value="[^"]*"/.test(found);
        })
    ) {
        warn(entry.manifestKey, "the entry for it in " + fileName + " is in a shape this hook does not recognise");
        return;
    }

    var kept = false;
    var updated = content.replace(node, function (found) {
        if (kept) return "";
        kept = true;
        return found.replace(/android:value="[^"]*"/, 'android:value="' + value + '"');
    });
    fs.writeFileSync(manifestPath, updated, "utf8");

    var folded = nodes.length - 1;
    log(
        entry.manifestKey +
            " written to " +
            fileName +
            (folded > 0 ? " (" + folded + (folded > 1 ? " duplicate entries" : " duplicate entry") + " folded in)" : "")
    );
}

// An iOS project can carry more than one <target>-Info.plist — an extension
// target has its own and never declares the key. So a plist without an entry is
// not a failure by itself: on the application's own target the pair is appended
// (the config-file that should have created it evidently did not reach this
// build), and on any other target it is left alone and kept out of the log.
//
// Two invariants hold that quiet in place. A key present in a shape the pattern
// does not recognise is reported rather than appended to, so the file never
// gains a duplicate. And silence is earned by handling the application's own
// target, not by writing somewhere: if that target was never identified, the
// pass warns even when another plist took the value, so a write that reached
// only an extension cannot pass for a configured build.
function updateIos(projectRoot, entry, value, mainTargets) {
    var iosRoot = path.join(projectRoot, "platforms/ios");
    if (!fs.existsSync(iosRoot)) return;

    var key = escapeForRegExp(entry.plistKey);
    var declaresKey = new RegExp("<key>" + key + "</key>");
    var plists = [];
    fs.readdirSync(iosRoot).forEach(function (dir) {
        var plistPath = path.join(iosRoot, dir, dir + "-Info.plist");
        if (fs.existsSync(plistPath)) plists.push({ dir: dir, path: plistPath });
    });
    if (plists.length === 0) return;

    var written = [];
    var added = [];
    var problems = [];
    var appTargetDone = false;

    plists.forEach(function (plist) {
        var fileName = path.basename(plist.path);
        var isAppTarget = plists.length === 1 || mainTargets.indexOf(plist.dir) !== -1;
        var problem = applyValue(
            plist.path,
            // cordova writes an empty value as a self-closing <string/>, never as <string></string>
            new RegExp("(<key>" + key + "</key>\\s*)(?:<string>[^<]*</string>|<string\\s*/>)"),
            function (match, head) {
                return head + "<string>" + value + "</string>";
            }
        );
        if (problem === null) {
            written.push(fileName);
            if (isAppTarget) appTargetDone = true;
            return;
        }

        if (declaresKey.test(fs.readFileSync(plist.path, "utf8"))) {
            problems.push("the entry for it in " + fileName + " is in a shape this hook does not recognise");
            return;
        }
        if (!isAppTarget) {
            return;
        }

        problem = insertPlistEntry(plist.path, entry.plistKey, value);
        if (problem === null) {
            added.push(fileName);
            appTargetDone = true;
        } else {
            problems.push(problem);
        }
    });

    if (written.length > 0) {
        log(entry.plistKey + " written to " + written.join(", "));
    }
    if (added.length > 0) {
        log(entry.plistKey + " added to " + added.join(", ") + " (the build declared no entry for it)");
    }
    problems.forEach(function (problem) {
        warn(entry.plistKey, problem);
    });

    if (appTargetDone || problems.length > 0) return;

    var names = plists.map(function (plist) {
        return path.basename(plist.path);
    });
    warn(
        entry.plistKey,
        written.length > 0
            ? "the application's own target is not among " +
              names.join(", ") +
              ", so the value reached only " +
              written.join(", ")
            : "no entry for it in " + names.join(", ")
    );
}

module.exports = function (context) {
    try {
        var projectRoot = context.opts.projectRoot;
        var preferences = readPreferences(projectRoot);
        var mainTargets = mainTargetNames(projectRoot);
        ENTRIES.forEach(function (entry) {
            var value = (preferences[entry.pref] || "").trim();
            if (!value) return;
            updateAndroid(projectRoot, entry, value);
            updateIos(projectRoot, entry, value, mainTargets);
        });
    } catch (error) {
        log("failed, leaving the build untouched: " + error.message);
    }
};
