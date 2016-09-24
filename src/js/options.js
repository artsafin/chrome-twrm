$(function(){
    configure(function(config){

        var form = $('options-form').get(0);

        $(form).on('saveclick', function(e){
            console.log('[options] save', form.data);

            chrome.storage.local.set(form.data, function(){
                form.toast('success');
            });
        });

        function loadSettings() {
            console.log('load items', config);
            form.data = config;
        }

        loadSettings();
    });
});