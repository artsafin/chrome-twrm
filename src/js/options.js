$(function(){
    configure(function(config){

        var toastTimeout = 2000,
            inputSelector = ':not(button):input[id]';

        $('form:first').submit(function(e){
            e.preventDefault();

            var map = {};
            $(this).find(inputSelector).each(function(){
                var el = $(this);
                map[this.id] = el.is(':checkbox') ? el.prop('checked') : el.val();
            });

            console.log('[options] save', map);

            chrome.storage.local.set(map, function(){
                Materialize.toast('Settings saved', toastTimeout);
            });
        });

        $('#btn-reset').click(function(){
            chrome.storage.local.clear(function(){
                loadSettings();
                Materialize.toast('Extension has been reset', toastTimeout);
            });
        });

        function loadSettings() {
            console.log('load items', config);
            $(inputSelector).each(function(){
                var v = config[this.id],
                    el = $(this);

                if (v === undefined) {
                    console.log("[options] undefined", v);
                }
                if (el.is(':checkbox')) {
                    el.prop('checked', !!v);
                } else {
                    el.val(v);
                }
            });
        }

        loadSettings();
    });
});