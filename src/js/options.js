const setStatus = (status) => {
    document.getElementById('status').innerHTML = status;
};

const setField = (id, value, defValue = '') => {
    const el = document.getElementById(id);

    if (el.type === 'checkbox') {
        el.checked = value;
    } else if (el) {
        el.value = value || defValue;
    }
};
const getField = (id, defValue = '') => {
    const el = document.getElementById(id);

    if (!el) {
        return defValue;
    }

    if (el.type === 'checkbox') {
        return el.checked;
    }

    return el.value;
};

window.onload = () => {
    configure
        .then((config) => {

            document.getElementById('save').addEventListener('click', () => {
                setStatus('Saving...');

                const newConfig = {
                    twUrl: getField("twUrl"),
                    redmineUrl: getField("redmineUrl"),
                    overridesStr: getField("overridesStr"),
                    redmineProject: getField("redmineProject"),
                    redmineProjectId: getField("redmineProjectId"),
                    redmineApiKey: getField("redmineApiKey")
                };
                chrome.storage.local.set({...defaultConfig, ...newConfig}, () => {
                    setStatus('Saved');

                    chrome.storage.local.get(null, (options) => {
                        console.log('options after save', options);
                    });
                });
            });

            setStatus('');

            setField('twUrl', config.twUrl);
            setField('redmineUrl', config.redmineUrl);
            setField('overridesStr', config.overridesStr);
            setField('redmineProject', config.redmineProject);
            setField('redmineProjectId', config.redmineProjectId);
            setField('redmineApiKey', config.redmineApiKey);
        });
};
