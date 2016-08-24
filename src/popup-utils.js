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

function htmlToTextile(html, baseUrl){
    try {
        html = html.replace(/(<br>|<\/li>)/g, "\n");
        html = html.replace(/<\/p>/g, "\n\n");
        html = html.replace(/<li>/g, "* ");
        html = html.replace(/<p>(.)/g, "p. $1");
        html = html.replace(/(<b>|<\/b>)/g, "*");
        html = html.replace(/(<ul>|<\/ul>)/g, "");
        html = html.replace(/<img.*?src="([^"]+)".*?>/g, " !{0}$1! ".format(baseUrl));
        html = html.replace(/<.*?>/g, "");

        return html;

        var txt = $(html).text();

        return txt;
    } catch (e) {
        console.log('[popup] ERR:', e);
    }

    return ":(";
}

function createNewIssueLink(baseUrl, projectAlias, fields) {
    return "{0}/projects/{1}/issues/new?{2}".format(baseUrl, projectAlias, $.param(fields));
}

function getRedmineParamsByTwData(baseUrl, tw, overrideParams) {
    // var description = htmlToTextile(tw.sel.html || tw.head_content, baseUrl).replace(/^/mg, '> ');
    var description = htmlToTextile(tw.sel.html || "Please refer to Teamwox", baseUrl).replace(/^/mg, '> ');
    var twLink = tw.sel.href ? "TW post @{0}@: {1}".format(tw.sel.linkName, tw.sel.href) : "TW: {0}".format(tw.self_link);

    var subject = tw.title;
    if (tw.sel.linkName) {
        var selAsText = $('<div/>').html(tw.sel.html).text();
        subject += (selAsText.length > 50) ? (" / post " + tw.sel.linkName) : (" / " + selAsText);
    }

    return $.extend({
        "issue[subject]": subject,
        "issue[tracker_id]": 4, // Task
        "issue[description]": twLink + "\n\n" + description,
        "issue[custom_field_values]": {
            "1": tw.sel.href || tw.self_link,
            "12": "Support"
        }
    }, overrideParams || {});
}