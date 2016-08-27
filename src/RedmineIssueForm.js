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

    cls.fromTw = function(tw, issues){
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
            "issue[tracker_id]": issues.defaultTracker,
            "issue[description]": twMetaLinks + "\n\n\n" + description,
            "issue[custom_field_values]": {
                "1": tw.sel.href || tw.self_link, // Teamwox
            }
        });

        // Creates a "project" redmine
        if (tw.project && selAsText.replace("Project:", "").trim() == tw.project) {
            form
                .typeOfIssue("Project", true)
                .targetVersion(issues.projectTargetVersion)
                .subject(issues.projectPrefix + tw.project)
            ;
        }

        if (tw.important) {
            form.priority(issues.importantPriority);
        }

        return form;
    };

    return cls;
})();