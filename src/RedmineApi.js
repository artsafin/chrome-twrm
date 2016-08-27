RedmineApi = (function(){
    function cls(redmineUrl, redmineApiKey){
        this.redmineUrl = redmineUrl;
        this.redmineApiKey = redmineApiKey;
    }

    cls.prototype = {
        getIssues: function(params){
            var url = "{0}/issues.json?key={1}&{2}".format(this.redmineUrl, this.redmineApiKey, $.param(params));
            console.log("RM url", url);
            return $.ajax({
                method: "GET",
                url: url
            });
        },
        getIssue: function(id){
            var url = "{0}/issues/{2}.json?key={1}".format(this.redmineUrl, this.redmineApiKey, id);
            console.log("RM url", url);
            return $.ajax({
                method: "GET",
                url: url
            });
        }
    };

    return cls;
})();