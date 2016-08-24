function TwCrawler(w) {
    this.window = w;
    this.content = w.$('.content-view-ext');
    this.body = this.content.find('.body');
    this.head = this.content.find('.head');
}
TwCrawler.prototype = {
    getSelectionContext: function() {
        var selection = this.window.getSelection();
        if (selection.rangeCount <= 0) {
            return null;
        }

        var range = selection.getRangeAt(0);

        if (range.startOffset == range.endOffset) {
            return null;
        }

        var startEl = $(range.startContainer);
        var commentItemEl = startEl.closest('div.item');
        var selectionLink = commentItemEl.length ? commentItemEl.find('.head a.link') : startEl.find('div.item').prev('div.item').find('.head a.link');

        var clonedSelection = range.cloneContents();
        var div = document.createElement('div');
        div.appendChild(clonedSelection);

        return {
            linkName: selectionLink.text(),
            href: selectionLink.attr('href'),
            html: div.innerHTML
        };
    },
    getHeadAttachments: function(){
        return this.body.find('.attachment_list .attach-item a[href]')
            .map(function(){
                return {
                    href: this.href,
                    name: this.innerHTML
                };
            })
            .get();
    },
    getResponsibles: function(){
        return this.head.find('.custom div .blue')
            .map(function(){
                return this.innerHTML;
            })
            .get();
    },
    getPostData: function(withSelection){
        return {
            title: this.head.find('div.title div.text').html(),
            section: this.head.find('.description a').html(),
            project: this.head.find('.details a[href^="/projects"]').html(),
            self_link: this.window.location.href,
            head_content: this.body.find('div.content').html(),
            head_attachments: this.getHeadAttachments(),
            sel: (withSelection ? this.getSelectionContext() : null) || {},
            responsibles: this.getResponsibles(),
            important: this.content.is(".important")
        };
    }
};

/*

{
    title: [
        {match: "qwerty", "issue[]"}
    ]
}

*/