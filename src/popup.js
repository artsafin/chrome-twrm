if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

chrome.tabs.query({active: true}, function(tabs){
    console.log('[popup] tabs', tabs);

    if (!tabs.length) {
        return;
    }

    var tab = tabs[0];

    function createNewIssueLink(baseUrl, projectAlias, fields) {
        return "{0}/projects/{1}/issues/new?{2}".format(baseUrl, projectAlias, $.param(fields));
    }

    $(function(){
        $('#progress').hide();
        $('#placeholder').empty();

        var link = createNewIssueLink("https://redmine.fxtm", "web-development-department", {twrm_tab: tab.id});

        console.log('[popup]', link);

        $('#placeholder').append($("<iframe src='{0}'></iframe>".format(link)));
    });
});
