configure(function(config) {
    chrome.tabs.query({active: true}, function(tabs){
        if (!tabs.length) {
            return;
        }

        var tab = tabs[0];

        $(function(){
            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function(message){
                if (message && message.event == "postDataUpdate" && message.tw) {
                    var newIssue = RedmineIssueForm.fromTw(message.tw, config.issues);
                    newIssue.applyMatchOverrides(config.overrides);
                    newIssue.typeOfIssue("Support");

                    tryDetectParentIssue(newIssue, message.tw, function(form){
                        showIframe(form);
                    });
                }
            });
        });
    });

    function showIframe(rmForm){
        var link = rmForm.createNewIssueLink(config.redmineUrl, config.redmineProject);

        console.log('[popup]', rmForm, link);

        $('#progress').hide();
        $('#placeholder').html($("<iframe src='{0}'></iframe>".format(link)));
    };

    function tryDetectParentIssue(newIssue, tw, onComplete) {
        if (config.redmineApiKey && tw.project) {
            var api = new RedmineApi(config.redmineUrl, config.redmineApiKey);

            api.getIssues({subject: config.issues.projectPrefix + tw.project})
                .always(function(xhr){
                    if (xhr.status == 200 && xhr.responseJSON && xhr.responseJSON.issues && xhr.responseJSON.issues.length) {
                        newIssue.parentIssueId(xhr.responseJSON.issues[0].id || null);

                        if (xhr.responseJSON.issues[0].custom_fields) {
                            xhr.responseJSON.issues[0].custom_fields.map(function(v){
                                if (v.name == "Type of Issue") {
                                    newIssue.typeOfIssue(v.value, true);
                                    return false;
                                }
                            });
                        }
                    }

                    onComplete(newIssue);
                });

        } else {
            onComplete(newIssue);
        }
    }
});