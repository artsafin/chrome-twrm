IssueTooltip = (function(){

    var hideAfterMs = 200;

    function create(me, under) {
        var el = $('<div style="display:none" id="twrm_issue_tooltip"><ul>'
            + '<li><span data-twrm-it-id /> <span data-twrm-it-subject /></li>'
            + '<li><span data-twrm-it-priority /><span data-sep /><span data-twrm-it-assignee /></li>'
            + '<li><span data-twrm-it-status /><span data-sep /><span data-twrm-it-sprint /><span data-sep /><span data-twrm-it-progress /></li>'
            + '</ul>'
            + '<div id="twrm_it-loading">Loading...</div>'
            + '<div id="twrm_it-nodata">No data</div>'
            + '</div>');

        $(under).append(el);

        el = $(under).find("#twrm_issue_tooltip");
        el.on('mouseenter', function(){
            me.state("data");
        }).on('mouseleave', function(){
            me.hideAfter(hideAfterMs);
        });
        $(under).data("twrmIssueTooltip", el);

        return el;
    }

    function cls(bindTo){
        this.bindTo = bindTo;
        this.el = null;
        this.hideTimer = null;
    }

    cls.prototype = {
        state: function(state) {
            this.hideTimer && window.clearTimeout(this.hideTimer);

            if (!this.el) {
                return;
            }

            if (state == "loading") {
                this.el.show();
                this.el.find('ul').hide();
                this.el.find('#twrm_it-loading').hide();
                this.el.find('#twrm_it-nodata').hide();
            } else if (state == "nodata") {
                this.el.show();
                this.el.find('ul').hide();
                this.el.find('#twrm_it-loading').hide();
                this.el.find('#twrm_it-nodata').show();
            } else if (state == "data") {
                this.el.show();
                this.el.find('ul').show();
                this.el.find('#twrm_it-loading').hide();
                this.el.find('#twrm_it-nodata').hide();
            } else if (state == "hide") {
                this.el.hide();
                this.el.find('ul').hide();
                this.el.find('#twrm_it-loading').show();
                this.el.find('#twrm_it-nodata').hide();
            }
        },
        noData: function(){
            this.state("nodata");

            return this;
        },
        data: function(data){
            this.state("data");

            var cf = {};
            data.custom_fields.map(function(v){
                cf[v.name] = v.value;
            });

            this.el.find('[data-twrm-it-id]').text("#" + data.id);
            this.el.find('[data-twrm-it-subject]').text(data.subject);
            this.el.find('[data-twrm-it-priority]').text("{0} {1}".format(data.priority ? data.priority.name : "-", cf["Customer Priority"] || ""));
            this.el.find('[data-twrm-it-status]').text(data.status ? data.status.name : "(no status)");
            this.el.find('[data-twrm-it-assignee]').text(data.assigned_to ? data.assigned_to.name : "(not assigned)");

            if (data.fixed_version) {
                this.el.find('[data-twrm-it-sprint]').text(data.fixed_version.name).show();
            } else {
                this.el.find('[data-twrm-it-sprint]').hide();
            }

            var spent = data.spent_hours && parseFloat(data.spent_hours);
            spent = (!spent || isNaN(spent)) ? 0 : Math.round(spent * 100) / 100;
            var est = data.estimated_hours && parseFloat(data.estimated_hours);
            est = (!est || isNaN(est)) ? 0 : Math.round(est * 100) / 100;
            if (spent != 0 || est != 0) {
                this.el.find('[data-twrm-it-progress]').text("{0}/{1}".format(spent, est)).show();
            } else {
                this.el.find('[data-twrm-it-progress]').hide();
            }

            return this;
        },
        showLoadingNear: function(other){
            if (!this.el) {
                this.el = create(this, this.bindTo);
            }

            this.state("loading");

            this.el.position({
                of: other,
                my: "left+10px top+10px",
                at: "left bottom",
            });

            return this;
        },
        hideAfter: function(timeout){
            var me = this;
            this.hideTimer = window.setTimeout(function(){
                me.state("hide");
            }, timeout || hideAfterMs);
        }
    };

    return cls;
})();