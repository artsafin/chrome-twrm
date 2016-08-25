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

RedmineIssueForm = (function(){

    function deepSet(destObj, fromObj) {
        return $.extend(true, destObj, fromObj);
    }

    function cls(initial){
        this.params = initial || {};
    }
    cls.prototype = {
        applyMatchOverrides: function(ovr) {
            var result = {};

            if (!ovr) {
                return result;
            }

            for (var k in ovr) if (ovr.hasOwnProperty(k)) {
                var refValue = this.params[k];
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

            return $.extend(true, this.params, result);
        },
        createNewIssueLink: function(baseUrl, projectAlias) {
            return "{0}/projects/{1}/issues/new?{2}".format(baseUrl, projectAlias, $.param(this.params));
        },

        // Setters
        assignedTo: function(val){
            deepSet(this.params, {"issue[assigned_to_id]": val});

            return this;
        },
        targetVersion: function(val){
            deepSet(this.params, {"issue[fixed_version_id]": val});

            return this;
        },
        typeOfIssue: function(val, overwrite){
            if (val !== undefined) {
                if (overwrite || this.typeOfIssue() === null || this.typeOfIssue() === undefined) {
                    deepSet(this.params, {"issue[custom_field_values]": {"12": val}});
                }

                return this;
            } else {
                try {
                    return this.params["issue[custom_field_values]"]["12"];
                } catch (err) {
                    return null;
                }
            }
        },
        parentIssueId: function(val){
            deepSet(this.params, {"issue[parent_issue_id]": val});

            return this;
        },
        subject: function(val){
            deepSet(this.params, {"issue[subject]": val});

            return this;
        },
        priority: function(val){
            deepSet(this.params, {"issue[priority_id]": val});

            return this;
        }
    };

    cls.fromTw = function(tw){
        // var description = htmlToTextile(tw.sel.html || tw.head_content, twUrl).replace(/^/mg, '> ');
        var description = Utils.htmlToTextile(tw.sel.html || "Please refer to Teamwox", tw.base_url).replace(/^/mg, '> ');
        var twMetaLinks = tw.sel.href ? "TW post @{0}@: {1}".format(tw.sel.linkName, tw.sel.href) : "TW: {0}".format(tw.self_link);
        if (tw.project) {
            twMetaLinks += "\n";
            twMetaLinks += "Project: " + tw.project;
        }

        var subject = tw.title;
        var selAsText = $('<div/>').html(tw.sel.html).text().trim();
        if (tw.sel.linkName) {
            subject += (selAsText.length > 70) ? (" / post " + tw.sel.linkName) : (" / " + selAsText);
        }

        var form = new cls({
            "issue[subject]": subject,
            "issue[tracker_id]": cls.DEFAULT_TRACKER,
            "issue[description]": twMetaLinks + "\n\n\n" + description,
            "issue[custom_field_values]": {
                "1": tw.sel.href || tw.self_link, // Teamwox
            }
        });

        // Creates a "project" redmine
        if (tw.project && selAsText.replace("Project:", "").trim() == tw.project) {
            form
                .typeOfIssue("Project", true)
                .targetVersion(cls.PROJECT_TARGET_VERSION)
                .subject(cls.PROJECT_PREFIX + tw.project)
            ;
        }

        if (tw.important) {
            form.priority(cls.IMPORTANT_PRIORITY);
        }

        return form;
    };

    cls.PROJECT_PREFIX = "Project / ";
    cls.PROJECT_TARGET_VERSION = 234;  // "Projects"
    cls.DEFAULT_TRACKER = 4; // "Task"
    cls.IMPORTANT_PRIORITY = 5; // "Blocker"

    return cls;
})();
