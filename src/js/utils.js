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

Utils = {
    htmlToTextile: function(html, baseUrl){
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
};

