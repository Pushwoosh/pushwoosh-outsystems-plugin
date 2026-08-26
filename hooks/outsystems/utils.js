var path = require("path");
var fs = require("fs");
const { log } = require("console");
/**
 * Get the platform version for the current execution
 * @param {object} context
 * @returns {string} platform version
 */
function getPlatformVersion(context) {
    var platform = context.opts.cordova.version;
    return platform;
}

function rmNonEmptyDir(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rmNonEmptyDir(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}


/**
 * Get the full path to the platform directory
 * @param {object} context Cordova context
 * @returns {string} absolute path to platforms directory
 */
function getPlatformPath(context) {
    var projectRoot = context.opts.projectRoot;
    var platform = context.opts.plugin.platform;
    return path.join(projectRoot, "platforms", platform);
}

/**
 * Get absolute path to the www folder inside the platform
 * and not the root www folder from the cordova project.
 * Example:
 *     - Android: project_foo/platforms/android/app/src/main/assets/www
 *     - iOS: project_foo/platforms/ios/www
 * @param {string} platform
 */
function getWwwPath(context) {
    var platformPath = getPlatformPath(context);
    console.log("platformPath: ", platformPath);
    var platform = context.opts.plugin.platform;
    console.log("platform: ", platform);
    var wwwfolder;
    if (platform === "android") {
        var platformVersion = getPlatformVersion(context);
        var majorPlatformVersion = platformVersion.split(".")[0];
        if (parseInt(majorPlatformVersion) >= 7) { 
            wwwfolder = "app/src/main/assets/www";
        } else {
            wwwfolder = "assets/www";
        }
    } else if (platform === "ios") {
        wwwfolder = "www";
    }
    return path.join(platformPath, wwwfolder);
}


// Sync on purpose: both router hooks patch the same manifest, async read/write raced and lost inserts (ZD 103369)
function installService(manifestPath, serviceName, serviceTemplate) {
    if (!fs.existsSync(manifestPath)) {
        throw new Error("AndroidManifest.xml not found at " + manifestPath);
    }

    var data = fs.readFileSync(manifestPath, 'utf8');

    // Replace, not skip: a name-only check would keep a stale service config on a reused platforms/android
    const existingService = new RegExp('\\s*<service[^>]*android:name="' + serviceName.replace(/\./g, '\\.') + '"[^>]*?(?:/>|>[\\s\\S]*?</service>)', 'g');
    var replaced = false;
    data = data.replace(existingService, function () { replaced = true; return ''; });
    if (replaced) {
        console.log('[PUSHWOOSH HELPER] ' + serviceName + ' already present, replacing');
    }

    const applicationRegex = /<application\b[^>]*>/;
    const applicationMatch = applicationRegex.exec(data);
    if (!applicationMatch) {
        throw new Error('<application> tag not found in AndroidManifest.xml');
    }

    const updatedManifest = data.substring(0, applicationMatch.index + applicationMatch[0].length) +
        serviceTemplate +
        data.substring(applicationMatch.index + applicationMatch[0].length);

    fs.writeFileSync(manifestPath, updatedManifest, 'utf8');
    console.log('[PUSHWOOSH HELPER] ' + serviceName + ' added to AndroidManifest.xml');
}


module.exports = {
    getPlatformVersion: getPlatformVersion,
    rmNonEmptyDir: rmNonEmptyDir,
    getPlatformPath: getPlatformPath,
    getWwwPath: getWwwPath,
    installService: installService,
};
