console.log("[inject] loaded", window.location.href);

configure(function(config){
    var tw = new TwCrawler(window);

    chrome.runtime.sendMessage(null, {event: "postShown", tw: tw.getPostData()});

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        // console.log('[inject] onMessage', arguments);

        if (message && message.event && message.event == "postDataDemanded") {
            sendResponse({event: "postDataUpdate", tw: tw.getPostData(true)});
        }

        if (message && message.event && message.event == "issueCreated" && message.text) {
            var updateUrl = window.location.href.replace("view", "comment/update");
            var data = new FormData();
            data.append('content', message.text);
            $.ajax({
                method: "POST",
                url: updateUrl,
                contentType: false,
                processData: false,
                data: data,
                dataType: "json",
                complete: function(xhr){
                    var json = JSON.parse(xhr.responseText);
                    var newUrl = window.location.origin + window.location.pathname + "?p_comment_id=" + json.comment_id + "#comment_" + json.comment_id;
                    // console.log('complete', arguments, newUrl);
                    setTimeout(function(){
                        window.location.href = newUrl;
                    }, 50);
                }
            });
        }
    });

    if (config.redmineApiKey) {
        var tooltip = new IssueTooltip(document.body);

        $(document.body).on('mouseenter mouseleave', 'a[href^="{0}/issues/"]'.format(config.redmineUrl), function(e){
            if (e.type == "mouseenter") {
                var link = this,
                    issueIdMatches = link.href.match(/\/(\d+)$/);
                if (!issueIdMatches || issueIdMatches.length != 2) {
                    console.log('mouseover no match', this, link.href);
                    return false;
                }

                var api = new RedmineApi(config.redmineUrl, config.redmineApiKey);

                tooltip.showLoadingNear(link);

                api.getIssue(issueIdMatches[1])
                    .then(function(json){
                        if (json && json.issue) {
                            tooltip.data(json.issue);
                        }
                    }, function(){
                        tooltip.nodata();
                    });
            } else if (e.type == "mouseleave") {
                tooltip.hideAfter(500);
            }
        });
    }
});