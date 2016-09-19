configure(function(config) {
    var Templating = (function(){
        function cls(){}

        // "tw-title": {href: tw.sel.href || tw.self_link, text: tw.title},

        cls.renderInPlace = function(root, vars){
            var el = $(root);
            for (var k in vars) if (vars.hasOwnProperty(k)) {
                var isObj = vars[k].constructor.name == 'Object';

                el.find("[data-tpl-{0}]".format(k)).each(function(){
                    if (isObj) {
                        for (var attr in vars[k]) if (vars[k].hasOwnProperty(attr)) {
                            if (attr == "text") {
                                $(this).text(vars[k][attr]);
                            } else if (attr == "html") {
                                $(this).html(vars[k][attr]);
                            } else if (attr == "addClass") {
                                $(this).addClass(vars[k][attr]);
                            } else {
                                $(this).attr(attr, vars[k][attr]);
                            }
                        }
                    } else {
                        $(this).text(vars[k]);
                    }
                });
            }
        };
        return cls;
    })();

    var PopupUI = (function(){
        function cls(){
            this.wiz = null;
        }

        cls.setVisibilityWithHidden = function(el, action) {
            var addOrRemoveClass = (action == 'hide') ? 'addClass' : 'removeClass',
                ell = $(el);
            ell[addOrRemoveClass]("hidden");

            return ell;
        };

        cls.prototype.progress = function(action){
            cls.setVisibilityWithHidden('#progress', action);

            return this;
        };

        cls.prototype.wizard = function(cb){
            if (!this.wiz) {
                this.wiz = new PopupUI.Wizard();
            }
            if (cb !== undefined) {
                cb.bind(this.wiz)();
                return this;
            }
            return this.wiz;
        };
        cls.prototype.iframe = function(action, link){
            if (link) {
                var escapedLink = link.replace(/'/g, "%27");
                $('#btn-new-window').attr('href', escapedLink);
                $('#iframe').attr('src', escapedLink);
            }

            cls.setVisibilityWithHidden('#iframe-container', action);

            return this;
        };

        return cls;
    })();

    PopupUI.Wizard = (function(){
        function cls(){
            var me = this;

            me.data = {parent: null};

            me.root = $('#issue-wizard');
            me.twPreview = $('#tw_preview');
            me.btnCreatePreview = $('#btn_create_preview');
            me.parentSelector = $('#parent-task-input');
            me.parentInfo = $('#parent_task_info');
        }

        function onParentSelector(me, text) {
            var autocompleteOptions = me.parentSelector.data('autocompleteOptions');

            me.data.parent = null;

            if (text && autocompleteOptions && autocompleteOptions[text]) {
                var issue = RedmineApi.Issue.fromJson(autocompleteOptions[text]),
                    link = api.createIssueLink(issue.id);

                me.data.parent = issue;

                PopupUI.setVisibilityWithHidden(me.parentInfo);

                Templating.renderInPlace(me.parentInfo, {
                    "rm-link": {href: link},
                    "author": issue.author ? issue.author.name : "(none)",
                    "teamwox": issue.cf["TeamWox"] ? issue.cf["TeamWox"] : "(none)",
                    "type-of-issue": issue.cf["Type of Issue"] ? issue.cf["Type of Issue"] : "(none)",
                    "combined-priority": (issue.cf["Customer Priority"] && issue.priority) ? "{0} {1}".format(issue.priority.name, issue.cf["Customer Priority"]) : "(none)",
                    "assigned-to": issue.assigned_to ? issue.assigned_to.name : "(none)"
                });
            } else {
                PopupUI.setVisibilityWithHidden(me.parentInfo, "hide");
            }
        }

        function bindHandlers(me) {
            me.btnCreatePreview
                .off('.popup')
                .on('click.popup', function (e) {
                    me.onCreatePreviewClick(me.getData(), this, me, e);
                });


            me.parentSelector.closest('.input-field').find('ul')
                .off('.popup')
                .on('click.popup', 'li', function () {
                    onParentSelector(me, me.parentSelector.val());
                });
        }

        cls.prototype = {
            hide: function(){
                PopupUI.setVisibilityWithHidden(this.root, "hide");
            },
            show: function(tw, options){
                var me = this;
                PopupUI.setVisibilityWithHidden(this.root);

                Templating.renderInPlace(me.twPreview, {
                    "tw-title": {href: tw.sel.href || tw.self_link, text: tw.title}
                });

                var autocompleteData = {},
                    optionMap = {};
                if (options.parentIssues) {
                    var parentIssues = options.parentIssues;
                    for (var i = 0, len = parentIssues.length; i < len; i++) {
                        autocompleteData[parentIssues[i].subject] = null;
                        optionMap[parentIssues[i].subject] = parentIssues[i];
                    }
                }
                me.parentSelector
                    .data('autocompleteOptions', optionMap)
                    .autocomplete({
                        data: autocompleteData
                    });

                bindHandlers(me);
            },
            getData: function(){
                return this.data;
            },
            onCreatePreviewClick: function () {
            }
        };

        return cls;
    })();

    var ui = new PopupUI();
    var api = new RedmineApi(config.redmineUrl, config.redmineApiKey);

    chrome.tabs.query({active: true}, function(tabs){
        if (!tabs.length) {
            return;
        }

        var tab = tabs[0];

        chrome.tabs.sendMessage(tab.id, {event: "postDataDemanded"}, null, function(message){
            if (message && message.event == "postDataUpdate" && message.tw) {
                $(function(){
                    onPostDataUpdate(message);
                });
            }
        });
    });

    function showIssue(newIssue) {
        var link = newIssue.createNewIssueLink(config.redmineUrl, config.redmineProject);

        console.log('showIssue link', link);

        ui.iframe('show', link)
            .wizard(function () {
                this.hide();
            })
            .progress("hide");
    }

    function onPostDataUpdate(message) {
        var newIssue = RedmineIssueForm.fromTw(message.tw, config.issues);
        newIssue.applyMatchOverrides(message.tw, config.overrides);
        newIssue.typeOfIssue("Support");

        ui.progress('show')
            .wizard(function () {
                this.hide();
            })
            .iframe('hide');

        if (!config.redmineApiKey) {
            showIssue(newIssue);
            return;
        }

        var wizard = ui.wizard();

        api.getIssues({"limit": 100, "fixed_version_id": config.issues.projectTargetVersion, "project_id": 18})
            .then(function(json){
                var list = RedmineApi.IssueList.fromJson(json),
                    options = list.issues,
                    collator = new Intl.Collator();

                options.sort(function (a, b) {
                    return collator.compare(a.subject, b.subject);
                });
                ui.progress("hide");


                wizard.show(message.tw, {parentIssues: options});
                wizard.onCreatePreviewClick = function (data, btn, ui, event) {
                    console.log('onCreatePreviewClick', data);

                    if (data.parent) {
                        var parentRm = RedmineApi.Issue.fromJson(data.parent);

                        newIssue.parentIssueId(data.parent.id);
                        newIssue.teamwox(parentRm.cf["TeamWox"]);
                        newIssue.customerPriority(parentRm.cf["Customer Priority"], true);
                        newIssue.typeOfIssue(parentRm.cf["Type of Issue"], true);
                        parentRm.priority && newIssue.priority(parentRm.priority.id, true);
                        parentRm.assigned_to && newIssue.assignedTo(parentRm.assigned_to.id);
                    }

                    showIssue(newIssue);
                };
            }, function(){
                ui.progress("hide");

                wizard.show(message.tw);
                wizard.onCreatePreviewClick = function (btn, ui, event) {
                    showIssue(newIssue);
                };
            })
        ;
    }
});

