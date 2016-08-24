function configure(cb) {
    var defaults = {
        twUrl: "https://tw.fxtm.com",
        redmineUrl: "https://redmine.fxtm",
        redmineProject: "web-development-department",
        overridesStr: "{}"
    };

    function normalize(config) {
        try {
            config.overrides = JSON.parse(config.overridesStr);
        } catch (err) {
            config.overrides = {};
            console.log('[configure] err', err);
        }

        return config;
    }

    chrome.storage.local.get(null, function(config) {
        cb(normalize($.extend(defaults, config || {})));
    });
}