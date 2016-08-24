configure(function(config) {
    function processOverrides(tw, ovr) {
        var result = {};

        if (!ovr) {
            return result;
        }

        for (var k in ovr) if (ovr.hasOwnProperty(k)) {
            var refValue = tw[k];
            if (refValue === undefined) {
                continue;
            }
            for (var i=0, leni=ovr[k].length; i<leni; i++) {
                if (!ovr[k][i].match || !ovr[k][i].params) {
                    continue;
                }

                var re = new RegExp(ovr[k][i].match);
                if (!$.isArray(refValue)) {
                    refValue = [refValue];
                }
                for (var j=0,lenj=refValue.length;j<lenj;j++) {
                    if (re.test("" + refValue[j])) {
                        $.extend(true, result, ovr[k][i].params);
                        break;
                    }
                }
            }
        }

        return result;
    }

    chrome.tabs.query({active: true}, function(tabs){
        console.log('[popup] tabs', tabs);

        if (!tabs.length) {
            return;
        }

        var tab = tabs[0];

        $(function(){
            chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function(message){
                if (message && message.event == "postDataUpdate" && message.tw) {
                    $('#progress').hide();
                    $('#placeholder').empty();

                    var rawParams = getRedmineParamsByTwData(config.redmineUrl, message.tw);
                    var overrides = processOverrides(message.tw, config.overrides);
                    var params = $.extend(true, rawParams, overrides);
                    console.log('[popup] overrides', params);

                    var link = createNewIssueLink(config.redmineUrl, config.redmineProject, params);

                    console.log('[popup]', link);

                    $('#placeholder').append($("<iframe src='{0}'></iframe>".format(link)));
                }
            });
        });
    });
});