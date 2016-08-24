window.console.info("[bg] loaded");

configure(function(config){
    chrome.webRequest.onHeadersReceived.addListener(
        function(info) {
            var headers = info.responseHeaders;
            for (var i=headers.length-1; i>=0; --i) {
                var header = headers[i].name.toLowerCase();
                if (header == 'x-frame-options' || header == 'frame-options') {
                    headers.splice(i, 1); // Remove header
                }
            }
            window.console.info("modified headers:", headers);
            return {responseHeaders: headers};
        },
        {
            urls: [ config.redmineUrl + '/*' ], // Pattern to match all http(s) pages
            types: [ 'sub_frame' ]
        },
        ['blocking', 'responseHeaders']
    );

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        window.console.info("[bg] onMessage", arguments);

        if (message && message.event && message.event == "postShown" && message.tw) {
            chrome.pageAction.show(sender.tab.id);
        }

    /*
        if (message && message.event && message.event == "postDataDemandedFromTab" && message.tab) {
            var twrmTabId = message.tab;
            chrome.tabs.sendMessage(twrmTabId, {event: "postDataDemanded"}, null, function(message){
                console.log("postDataDemanded response:", message);
                
                chrome.tabs.sendMessage(twrmTabId, {event: "postDataReceive", tw: message.tw});
            });
        }
        */

        if (message && message.event && message.event == "issueCreated" && message.text) {
            chrome.tabs.query({active: true}, function(tabs){
                if (!tabs.length) {
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, message);
            });
        }
    });
});