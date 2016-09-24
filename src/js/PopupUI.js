PopupUI = (function () {
    function cls() {
        this.wiz = null;
    }

    cls.setVisibilityWithHidden = function (el, action) {
        var addOrRemoveClass = (action == 'hide') ? 'addClass' : 'removeClass',
            ell = $(el);
        ell[addOrRemoveClass]("hidden");

        return ell;
    };

    cls.prototype.progress = function (action) {
        cls.setVisibilityWithHidden('#progress', action);

        return this;
    };

    cls.prototype.wizard = function (cb) {
        if (!this.wiz) {
            this.wiz = new PopupUI.Wizard();
        }
        if (cb !== undefined) {
            cb.bind(this.wiz)();
            return this;
        }
        return this.wiz;
    };
    cls.prototype.iframe = function (action, link) {
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

PopupUI.Wizard = (function () {
    function cls() {
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
                "combined-priority": (issue.cf["Customer Priority"] && issue.priority) ? "{0} {1}".format(issue.priority.name,
                    issue.cf["Customer Priority"]) : "(none)",
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
        hide: function () {
            PopupUI.setVisibilityWithHidden(this.root, "hide");
        },
        show: function (tw, options) {
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
        getData: function () {
            return this.data;
        },
        onCreatePreviewClick: function () {
        }
    };

    return cls;
})();