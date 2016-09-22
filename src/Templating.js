Templating = (function () {
    function cls() {
    }

    // "tw-title": {href: tw.sel.href || tw.self_link, text: tw.title},

    cls.renderInPlace = function (root, vars) {
        var el = $(root);
        for (var k in vars) if (vars.hasOwnProperty(k)) {
            var isObj = vars[k].constructor.name == 'Object';

            el.find("[data-tpl-{0}]".format(k)).each(function () {
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