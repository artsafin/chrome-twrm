$(function () {
    configure(function (config) {

        var ui = new PopupUI();
        var api = new RedmineApi(config.redmineUrl, config.redmineApiKey);

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (!tabs.length) {
                return;
            }

            var tab = tabs[0];

            console.log('send to', tabs, tab, config);

            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function (message) {
                if (message && message.event == "postDataUpdate" && message.tw) {
                    // console.log('message', message);
                    onPostDataUpdate(message);
                }
            });
        });

        function showIssue(newIssue) {
            var link = newIssue.createNewIssueLink(config.redmineUrl, config.redmineProject);

            console.log('showIssue link', link);

            ui.iframe('show', link)
                .wizard(function () {
                    this.hide();
                })
                .progress("hide");
        }

        function onPostDataUpdate(message) {
            var newIssue = RedmineIssueForm.fromTw(message.tw, config.issues);
            newIssue.applyMatchOverrides(message.tw, config.overrides);
            newIssue.typeOfIssue("Support");

            ui.progress('show')
                .wizard(function () {
                    this.hide();
                })
                .iframe('hide');

            if (!config.redmineApiKey) {
                showIssue(newIssue);
                return;
            }

            var wizard = ui.wizard();

            var requestParams = {
                "limit": 100,
                "fixed_version_id": config.issues.projectTargetVersion,
                "project_id": config.redmineProjectId
            };

            api.getIssues(requestParams)
                .then(function (json) {
                    var list = RedmineApi.IssueList.fromJson(json),
                        options = list.issues,
                        collator = new Intl.Collator();

                    options.sort(function (a, b) {
                        return collator.compare(a.subject, b.subject);
                    });
                    ui.progress("hide");


                    wizard.show(message.tw, {parentIssues: options});
                    wizard.onCreatePreviewClick = function (data, btn, ui, event) {
                        console.log('onCreatePreviewClick', data);

                        if (data.parent) {
                            var parentRm = RedmineApi.Issue.fromJson(data.parent);

                            newIssue.parentIssueId(data.parent.id);
                            newIssue.teamwox(parentRm.cf["TeamWox"]);
                            newIssue.customerPriority(parentRm.cf["Customer Priority"], true);
                            newIssue.typeOfIssue(parentRm.cf["Type of Issue"], true);
                            parentRm.priority && newIssue.priority(parentRm.priority.id, true);
                            parentRm.assigned_to && newIssue.assignedTo(parentRm.assigned_to.id);
                        }

                        showIssue(newIssue);
                    };
                }, function () {
                    ui.progress("hide");

                    wizard.show(message.tw);
                    wizard.onCreatePreviewClick = function (btn, ui, event) {
                        showIssue(newIssue);
                    };
                });
        }
    });
});