console.log("[inject] loaded", window.location.href);

configure(function(config){
    if (location.origin == config.twUrl) {
        var tw = new TwCrawler(window);

        chrome.runtime.sendMessage(null, {event: "postShown", tw: tw.getPostData()});

        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            console.log('[inject] onMessage', arguments);

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
    } 
    /*
    else if (location.hostname == "redmine.fxtm" && location.pathname.match(/\/issues\/new$/)) {
        console.log("[inject rm new]", twrmTabMatches);
        // chrome.runtime.sendMessage(null, {event: "postDataDemandedFromTab", tab: parseInt(twrmTabMatches[1])});

        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            console.log('[inject rm new] onMessage', arguments);
        });
    }
    */
    else if (location.origin == config.redmineUrl && location.pathname.match(/\/issues\/\d+$/)) {
        console.log("[inject rm] /issues/*");

        var flashText = $("#flash_notice").html();

        if (flashText && flashText.match(/^Issue.*created/)) {
            var addTwReferenceLink = $("<a class='icon icon-report' href='#'>Post # to Teamwox</a>");
            addTwReferenceLink.click(function(){
                chrome.runtime.sendMessage(null, {event: "issueCreated", text: flashText});
            });

            $('#content').find('.contextual:first').prepend(addTwReferenceLink);
        }
    }
});