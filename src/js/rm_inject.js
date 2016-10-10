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

    $(function(){
        new FieldSummaryIndicator()
    });
});

var FieldSummaryIndicator = (function(){
    function getCellsSum(tdSelector) {
        return $('.context-menu-selection td.' + tdSelector).map(function () {
            try {
                return parseFloat(this.innerText);
            }
            catch (e) {
                return 0;
            }
        }).get().reduce(function (acc, it) {
            return acc + (isNaN(it) ? 0 : it);
        }, 0);
    }

    function getHtml() {
        var html = '<div id="fieldIndicator" style="width: 200px; height: 40px; position: fixed; background: white; border: 1px #ccc solid; bottom: 0; right: 0; box-shadow: -10px -7px 47px -15px rgba(120, 120, 120, 1);">'
                   + '<b>Est:</b>&nbsp;<span id="est">0</span><br><b>Spent:</b>&nbsp;<span id="spent">0</span>'
                   + '</div>';

        return html;
    }

    var cls = function(){
        var el = $(getHtml());

        $(document.body).append(el);

        $(document).on('click', 'tr', function () {
            var est = getCellsSum('estimated_hours'),
                spent = getCellsSum('spent_hours');

            el.find('#est').text(est);
            el.find('#spent').text(spent);
        });
    };

    return cls;
})();
