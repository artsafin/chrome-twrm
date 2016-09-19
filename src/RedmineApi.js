RedmineApi = (function(){
    function cls(redmineUrl, redmineApiKey){
        this.redmineUrl = redmineUrl;
        this.redmineApiKey = redmineApiKey;
    }

    cls.prototype = {
        createIssueLink: function (id) {
            return "{0}/issues/{1}".format(this.redmineUrl, id);
        },
        getIssues: function(params){
            var url = "{0}/issues.json?key={1}&{2}".format(this.redmineUrl, this.redmineApiKey, $.param(params));
            // console.log("RM url", url);
            return $.ajax({
                method: "GET",
                url: url
            });
        },
        getIssue: function(id){
            var url = "{0}/issues/{2}.json?key={1}".format(this.redmineUrl, this.redmineApiKey, id);
            // console.log("RM url", url);
            return $.ajax({
                method: "GET",
                url: url
            });
        }
    };

    return cls;
})();

RedmineApi.Issue = (function(){
    function cls(data){
        for (var k in data) if (data.hasOwnProperty(k)) {
            this[k] = data[k];
        }
    }

     cls.fromJson = function(json){
        var cf = {};
        if (json.custom_fields) {
            json.custom_fields.map(function(v){
                cf[v.name] = v.value;
            });
        }

        json.cf = cf;

        return new cls(json);
    };

    return cls;
})();

RedmineApi.IssueList = (function(){
    function cls(issues){
        this.issues = issues;
    }

    cls.prototype = {
        first: function(){
            return this.issues.length ? RedmineApi.Issue.fromJson(this.issues[0]) : null;
        }
    };

    cls.fromJson = function(json){
        if (!json.issues || !json.issues.length) {
            return new cls([]);
        }

        return new cls(json.issues);
    };
    return cls;
})();