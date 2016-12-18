configure(function(config) {
    var PROGRESS_HIDE_TIMEOUT = 3000;

    var api = new RedmineApi(config.redmineUrl, config.redmineApiKey),
        ui = null;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (!tabs.length) {
            return;
        }

        $(function () {
            ui = bindToUi();

            ui.$issueWizard.on('bulkcreateclick', function (e) {
                console.log('bulkcreateclick', e.detail.parent);
            });

            var progressHideTimer = setTimeout(function(){
                ui.issueWizard.stopProgress();
            }, PROGRESS_HIDE_TIMEOUT);

            var tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function (message) {
                if (message && message.event == "postDataUpdate" && message.tw) {
                    if (progressHideTimer) {
                        clearTimeout(progressHideTimer);
                    }
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
                ui = bindToUi();
                onPostDataUpdate(message);
                */
    });

    function bindToUi() {
        var $issuePreview = $('issue-preview'),
            $issueWizard = $('issue-wizard'),
            $pi = $('#parentIssues');
        return {
            pages: $('#pages').get(0),
            $issuePreview: $issuePreview,
            issuePreview: $issuePreview.get(0),
            $issueWizard: $issueWizard,
            issueWizard: $issueWizard.get(0),
            $parentIssue: $pi,
            parentIssue: $pi.get(0)
        }
    }

    function showIssue(newIssue) {
        var link = newIssue.createNewIssueLink(config.redmineUrl, config.redmineProject);

        console.log('showIssue link', link);

        ui.issuePreview.setHref(link);
        ui.pages.select(1);
    }

    function onPostDataUpdate(message) {
        ui.pages.select(0);

        var newIssue = RedmineIssueForm.fromTw(message.tw, config.issues);
        newIssue.applyMatchOverrides(message.tw, config.overrides);
        newIssue.typeOfIssue("Support");

        if (!config.redmineApiKey) {
            showIssue(newIssue);
            return;
        }

        ui.issueWizard.twLoaded = true;
        ui.issueWizard.title = message.tw.title;
        ui.issueWizard.rmHost = config.redmineUrl;

        if (!config.redmineApiKey) {
            showIssue(newIssue);
            return;
        }

        var requestParams = {
            "limit": 100,
            "fixed_version_id": config.issues.projectTargetVersion,
            "project_id": config.redmineProjectId
        };

        ui.$issueWizard.on('createpreviewclick', function (e) {
            // console.log('createpreviewclick', e);
            if (e && e.detail && e.detail.parent) {
                var parentRm = RedmineApi.Issue.fromJson(e.detail.parent);

                newIssue.parentIssueId(parentRm.id);
                newIssue.teamwox(parentRm.cf.teamwox);
                newIssue.customerPriority(parentRm.cf.customer_priority, true);
                newIssue.typeOfIssue(parentRm.cf.type_of_issue, true);
                parentRm.priority && newIssue.priority(parentRm.priority.id, true);
                parentRm.assigned_to && newIssue.assignedTo(parentRm.assigned_to.id);
            }
            showIssue(newIssue);
        });
        ui.$parentIssue.on('pt-item-confirmed', function () {
            console.log('pt-item-confirmed', this.inputObject);
            ui.issueWizard.issue = RedmineApi.Issue.fromJson(this.inputObject);
        });

        api.getIssues(requestParams)
            .always(function(){
                ui.issueWizard.stopProgress();
            })
            .then(function(json){
                var list = RedmineApi.IssueList.fromJson(json),
                    options = list.issues,
                    collator = new Intl.Collator();

                options.sort(function (a, b) {
                    return collator.compare(a.subject, b.subject);
                });

                ui.parentIssue.disabled = false;
                ui.parentIssue.localCandidates = options;
            });
    }
});

