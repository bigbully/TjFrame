//升级指南
(function ($) {
    window.tjGridInit = {
        gridWidth:function() {return $(window).width() - 5},
        dialogWidth: 360,
        bottomHeight:'20px',
        toppager:true,
        rowNum:20,
        rowList:[10, 20, 30],
        multiselect:true,
        view : true,
        toolbar:[true, "both"],
        search: 'top',//‘top' || 'bottom'
        searchLevel: 'pro',//'normal' || 'pro'
        buttonType :['inner',190],//'outer' || ['inner',190]
        inputTableClass:'infotable',
        inputTableLabelClass:'td1',
        inputTableLabelWidth:120,
        viewTableClass:'detailtable',
        viewTableLabelClass:'titletd',
        viewTableTextClass:'td',
        viewTableLabelWidth:120
    };
})(jQuery);