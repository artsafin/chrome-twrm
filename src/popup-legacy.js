configure(function(config) {
    chrome.tabs.query({active: true}, function(tabs){
        if (!tabs.length) {
            return;
        }

        var tab = tabs[0];

        $(function(){
            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function(message){
                if (message && message.event == "postDataUpdate" && message.tw) {
                    var newIssue = RedmineIssueForm.fromTw(message.tw);
                    newIssue.applyMatchOverrides(config.overrides);
                    newIssue.typeOfIssue("Support");

                    showIframeEnriched(newIssue, message.tw);
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

    function showIframeEnriched(newIssue, tw) {

        // console.log('[popup] showIframeEnriched', tw, newIssue);
        if (config.redmineApiKey && tw.project) {
            var url = "{0}/issues.json?key={1}&subject={2}".format(config.redmineUrl, config.redmineApiKey, encodeURIComponent(RedmineIssueForm.PROJECT_PREFIX + tw.project));
            console.log("RM url", url);
            $.ajax({
                method: "GET",
                url: url,
                complete: function(xhr){
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

                    showIframe(newIssue);
                }
            });
        } else {
            showIframe(newIssue);
        }
    }
});