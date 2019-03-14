window.onload = () => {
    configure.then((config) => {
        var PROGRESS_HIDE_TIMEOUT = 3000;

        var api = new RedmineApi(config.redmineUrl, config.redmineApiKey),
            ui = null;

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (!tabs.length) {
                return;
            }

            var tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function (message) {
                if (message && message.event == "postDataUpdate" && message.tw) {
                    onPostDataUpdate(message);
                }
            });
        });



        /*
            var message = {
                "event": "postDataUpdate",
                "tw": {
                    "base_url": "https://tw.fxtm.com",
                    "title": "test se\"r<v>ice desk's",
                    "author": "Artur Safin",
                    "section": "Unsorted",
                    "project": "",
                    "self_link": "https://tw.fxtm.com/servicedesk/view/43259#comment_769696",
                    "head_content": "<p>test service desl</p><p>test service desl</p><p>test service desl</p><p>test service desl</p><p>test service desltest service desltest service desltest service desltest service desl&nbsp;</p>",
                    "head_attachments": [],
                    "sel": {},
                    "assigned": [],
                    "responsibles": [],
                    "important": false
                }
            };
        */
        function onPostDataUpdate(message) {
            var newIssue = RedmineIssueForm.fromTw(message.tw, config.issues);
            newIssue.applyMatchOverrides(message.tw, config.overrides);
            newIssue.typeOfIssue("Support");

            showIssueInIframe(newIssue);
        }

        function showIssueInIframe(newIssue) {
            var link = newIssue.createNewIssueLink(config.redmineUrl, config.redmineProject);
            var escapedLink = link.replace(/'/g, "%27");

            document.getElementById('iframe').src = escapedLink;
        }
    });
};
