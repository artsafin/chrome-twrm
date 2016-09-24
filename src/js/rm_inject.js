console.log("[rm-inject] loaded", window.location.href);

var isLoadedFromPopup = false;
try {
    top.location.href;
} catch (err) {
    isLoadedFromPopup = true;
}

function addCss(root) {
    var html = "<link type='text/css' rel='stylesheet' media='all' "
                + "href='chrome-extension://{0}/build/minimal_redmine.css' />"
                    .format(chrome.i18n.getMessage('@@extension_id'));
    $(root).prepend(html);
}

configure(function(config){
    if (isLoadedFromPopup) {
        addCss(document.body);
    }

    if (location.pathname.match(/\/issues\/\d+$/) && isLoadedFromPopup) {
        console.log("[inject rm] /issues/*");

        var flashText = $("#flash_notice").html();

        if (flashText && flashText.match(/^Issue.*created/)) {
            var addTwReferenceLink = $("<a class='icon icon-report' href='#'>Post to Teamwox</a>");
            addTwReferenceLink.click(function(){
                var newEl = $('<div/>').html(flashText);
                var newHref = config.redmineUrl + newEl.find("a[href]").attr("href");
                newEl.find('a[href]').attr('href', newHref);

                chrome.runtime.sendMessage(null, {event: "issueCreated", text: newEl.html()});
            });

            $('#content').find('.contextual:first').prepend(addTwReferenceLink);
        }
    }
});

