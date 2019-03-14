console.log("[tw_sd_inject] loaded", window.location.href, configure);

window.onload = () => {
    configure.then((config) => {
        var tw = new TwCrawler(window);

        chrome.runtime.sendMessage(null, {event: "postShown", tw: tw.getPostData()});

        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            // console.log('[inject] onMessage', arguments);

            if (message && message.event && message.event == "postDataDemanded") {
                sendResponse({event: "postDataUpdate", tw: tw.getPostData(true)});
            }

            if (message && message.event && message.event == "issueCreated" && message.text) {
                var updateUrl = window.location.href.replace("view", "comment/update");
                console.log('issueCreated', updateUrl);
                var data = new FormData();
                data.append('content', message.text);
                $.ajax({
                    method: "POST",
                    url: updateUrl,
                    contentType: false,
                    processData: false,
                    data: data,
                    dataType: "json",
                    complete: function (xhr) {
                        var json = JSON.parse(xhr.responseText);
                        var newUrl = window.location.origin + window.location.pathname + "?p_comment_id=" + json.comment_id + "#comment_" + json.comment_id;
                        // console.log('complete', arguments, newUrl);
                        setTimeout(function () {
                            window.location.href = newUrl;
                        }, 50);
                    }
                });
            }
        });

        if (config.redmineApiKey) {
            var tooltip = new IssueTooltip(document.body);

            const redmineLinkPrefix = 'a[href^="{0}/issues/"]'.format(config.redmineUrl);

            const anchors = document.querySelectorAll(redmineLinkPrefix);

            anchors.forEach((anchor) => {
                var btn = document.createElement('span');
                btn.className = "redmine-link";
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                });

                anchor.appendChild(btn);
            });
        }
    });
};
