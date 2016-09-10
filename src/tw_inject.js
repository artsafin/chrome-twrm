console.log("[inject-left] loaded", window.location.href);

var tw;

$(function(){
    tw = new TW(document);
});

var TW = (function(){

    function globalKeyHandler(e) {
        if (e.key.length != 1 && e.key != "Escape") {
            return; // Just modifier pressed
        }

        console.log('globalKeyHandler', e);

        if (e.keyCode == 191 && this.left) { // Slash
            this.left.beginSearch();
        }
        if (e.key == "Escape" && this.left) {
            this.left.endSearch();
        }
    }

    function cls(rootDoc){
        var me = this;

        $(rootDoc).on('keydown', globalKeyHandler.bind(me));

        $(rootDoc).find('#frame_left').on('load', function(){
            console.log('frame_left load');
            $(this.contentDocument).on('keydown', globalKeyHandler.bind(me));

            me.left = new TW.Left(this.contentDocument);
        });
        $(rootDoc).find('#frame_content').on('load', function(){
            console.log('frame_content load');
            $(this.contentDocument).on('keydown', globalKeyHandler.bind(me));

            me.center = this.contentDocument;
        });
    };

    return cls;
})();

TW.Left = (function(){

    function cls(doc){
        var me = this;

        me.doc = doc;
        me.index = {};

        $(me.doc).find('a.plus').each(function(){
            me.index[$(this).text()] = this;
        });

        me.sb = new IncrementalSearchBar(me.doc);
        me.sb.onSearch(function(str){
            var re = str.length ? (new RegExp(str, "i")) : null;
            for (var k in me.index) if (me.index.hasOwnProperty(k)) {
                var showOrHide = (!re || re.test(k)) ? 'show' : 'hide';

                $(me.index[k])[showOrHide]();
                $(me.index[k].nextSibling)[showOrHide]();
            }
        });
    };

    cls.prototype = {
        beginSearch: function(){
            var me = this;

            console.log('beginSearch');
            me.sb.showAndFocus();
        },
        endSearch: function(){
            console.log('endSearch');
            if (!this.sb) {
                return;
            }

            this.sb.hide();
        }
    };

    return cls;
})();

var IncrementalSearchBar = (function(){

    function cls(doc){
        var me = this;

        me.el = $('<div id="twrm_sb"><input placeholder="Filter by section" type="text" /></div>');
        me.input = me.el.find('input');

        me.el.on('transitionend webkitTransitionEnd', function(){
            if (me.el.hasClass("twrm_visible")) {
                setTimeout(function(){
                    me.input.focus().select();
                }, 100);
            }
        });

        me.input.on('keydown', function(spe){
            spe.stopPropagation();

            if (spe.key == "Escape") {
                spe.preventDefault();
                me.hide();
            }
        }).on('keyup', function(spe){
            me.searchCb && me.searchCb(this.value);
        }).on('blur', function(){
            me.hide();
        }).on('focus', function(){
            me.showAndFocus();
        });

        $(doc.body).prepend(me.el);
        me.searchCb = null;
    };

    cls.prototype = {
        showAndFocus: function(){
            this.el && this.el.addClass("twrm_visible");
        },
        hide: function(){
            if (this.el) {
                this.el.removeClass("twrm_visible");
            }
        },
        onSearch: function(cb){
            this.searchCb = cb;
        }
    };

    return cls;
})();
