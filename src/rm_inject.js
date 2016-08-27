console.log("[inject] loaded", window.location.href);

configure(function(config){
    if (location.pathname.match(/\/issues\/\d+$/)) {
        console.log("[inject rm] /issues/*");

        var flashText = $("#flash_notice").html();

        if (flashText && flashText.match(/^Issue.*created/)) {
            var addTwReferenceLink = $("<a class='icon icon-report' href='#'>Post # to Teamwox</a>");
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