const defaultConfig = {
    twUrl: "https://tw.fxtm.com",
    overridesStr: "{}",
    redmineUrl: "https://redmine.fxtm",
    redmineProject: "web-development-department",
    redmineProjectId: 18,
    redmineApiKey: "",
    redmineProjectPrefix: "Project / ",
    redmineProjectTargetVersion: 234, // "Projects"
    redmineDefaultTracker: 4, // "Task"
    redmineImportantPriority: 5 // "Blocker"
};

const normalizeConfig = (config) => {
    try {
        config.overrides = JSON.parse(config.overridesStr);
    } catch (err) {
        config.overrides = {};
        console.log('[configure] err', err);
    }

    config.issues = {
        projectPrefix: config.redmineProjectPrefix,
        projectTargetVersion: config.redmineProjectTargetVersion,
        defaultTracker: config.redmineDefaultTracker,
        importantPriority: config.redmineImportantPriority
    };

    return config;
}

window.configure = new Promise((resolve, reject) => {
    chrome.storage.local.get(null, function (config) {
        const configValues = normalizeConfig({...defaultConfig, ...config});
        resolve(configValues);
    });
});
