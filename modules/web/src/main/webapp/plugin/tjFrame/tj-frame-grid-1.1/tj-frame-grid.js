(function ($) {
    $.fn.grid = function (options) {
        if (this.length == 1 && $(this).data('tjGrid') == undefined) {//如果尚未初始化则进行初始化
            var tjGrid = new TjGrid(this, options);
            $(this).data('tjGrid', tjGrid);
        }
    }

    $.fn.tjSearch = function (url) {
        if (this.length == 1 && $(this).data('tjGrid') != undefined) {
            if ($(this).find('*[id="grid-table-' + $(this).attr('id') + '"]').length > 0) {
                $(this).find('*[id="grid-table-' + $(this).attr('id') + '"]').jqGrid('setGridParam', {url:url, page:1}).trigger("reloadGrid");
            }
        }
    };

    function TjGrid(target, options) {
        this.id = $(target).attr('id');
        this.target = target;
        this.name = options.name;
        this.loadUrl = $.extend({content:this.getCrudUrl('load')}, options.loadUrl || {}); //分页查询url
        this.saveUrl = $.extend({content:this.getCrudUrl('save')}, options.saveUrl || {}); //新增或编辑url
        this.delUrl = $.extend({content:this.getCrudUrl('delete')}, options.delUrl || {}); //删除url
        this.inputUrl = $.extend({type:'ajax'}, options.inputUrl || {}); //新增编辑页面的url
        this.multiUrl = $.extend({content:this.getCrudUrl('multiSave')}, options.multiUrl || {}); //新增编辑页面的url
        this.viewUrl = $.extend({type:'ajax'}, options.viewUrl || {}); //查看细节页面的url
        this.dynamicUrl = this.getCrudUrl('dynamic'); //查看细节页面的url
        this.dynamicColumns = options.operation && options.operation.dynamicColumns || false;//动态增减列的功能，默认关闭
        this.colModelsDetail = this.loopColModels(options);//通过循环得到解析后的colModels和names
        this.gridType = options.gridType || 'default';
        this.tjGridView = this.createTjGridView(this, options.operation);
    }

    $.extend(TjGrid.prototype, {
        curUrl:window.location.href,
        loopColModels:function (options) {//把每个ColModel填充到tjColModels中
            var loopResult = {colModels:[], colNames:[], colItems:[], relateArray:[]};
            var $this = this;
            if (this.dynamicColumns) {//如果有动态加载功能，使用动态加载进行筛选
                $.each(options.colModel, function (index, value) {
                    value.hiddenInTable = value.hidden || (!($.evalJSON($this.dynamicColumns))[value.name] ? true : false);
                    $this.pushGridColDetails(value, loopResult);
                });
            } else {
                $.each(options.colModel, function (index, value) {
                    value.hiddenInTable = value.hidden;
                    $this.pushGridColDetails(value, loopResult);
                });
            }
            return loopResult;
        },
        pushGridColDetails:function (value, loopResult) {
            var tjColModel = new TjColModel(value);
            var gridItem = new TjGridItem(value);
            loopResult.colNames.push(value.header);
            loopResult.colModels.push(tjColModel);
            loopResult.colItems.push(gridItem.item);
        },
        createTjGridView:function (tjGrid, operation) {//根据不同的表格type生成不同规格的表格view
            switch (tjGrid.gridType) {
                case 'default':
                    return new DefaultView(tjGrid, operation);
                    break;
                case 'easy':
                    return new EasyView(tjGrid, operation);
                    break;
                case 'onlyCheck':
                    return new OnlyCheckView(tjGrid, operation);
                    break;
                case 'noSearch':
                    return new NoSearchView(tjGrid, operation);
                    break;
            }
        },
        getCrudUrl:function (operation) {
            return this.curUrl.substring(0, this.curUrl.lastIndexOf('!')) + '!' + operation + '.action'
        }
    });

    function TjGridView(tjGrid, operation) {
        this.tjGrid = tjGrid;
        this.operation = $.extend(this.defaultOperation, operation || {});
        this.isInnerBtn = function () {
            return this.operation.toolbar && this.operation.buttonType != 'outer'
        };
        this.analyzeViewComponents = function () {//根据operation分析view有哪些组件
            //所有view都需要有table和分页，这是根本
            this.pageBar = new TjPageBar(this);
            this.table = new TjTable(this);
            this.buttonList = [];//用来保存按钮组
            this.customButtonMap = {};//用来保存自定义按钮组
            this.customButtonInnerMap = {};
            //如果有新增编辑功能
            if (this.operation.add || this.operation.edit) {
                if (tjGrid.inputUrl.content) {//自定义新增编辑
                    this.inputDialog = new TjCustomDialog(this, tjGrid.inputUrl.content, tjGrid.inputUrl.type);
                } else {//使用默认的新增编辑页面
                    this.inputDialog = new TjInputDialog(this);
                }
                //如果有多选功能，则自动开放多选编辑功能
                if (this.operation.multiselect) {
                    this.multiDialog = new TjMultiDialog(this);
                }
            }
            //如果有查看功能
            if (this.operation.view) {
                if (tjGrid.viewUrl.content) {//自定义查看
                    this.viewDialog = new TjCustomDialog(this);
                } else {//使用默认的查看页面
                    this.viewDialog = new TjViewDialog(this);
                }
            }
            //是否需要有工具栏
            if (this.operation.toolbar) {
                this.toolbar = new TjToolbar(this);
            }
            //内置按钮提前初始化dialog
            if (this.operation.customBtns) {
                for (var i=0;i < this.operation['customBtns'].length ; i++) {
                    var customBtn = this.operation['customBtns'][i];
                    if (!customBtn.buttonType && tjGridInit.buttonType == 'inner' || customBtn.buttonType == 'inner'){
                        var tjCustomDialog = new TjCustomDialog(this,customBtn.url, customBtn.type, customBtn.width, customBtn.height);
                        this.customButtonInnerMap[i] = tjCustomDialog;
                    }
                }
            }
            if (this.operation.dynamicColumns){
                this.dynamicColumnsDiv = new TjDynamicColumnsDiv(this);
            }
        }
    }

    function DefaultView(tjGrid, operation) {
        this.defaultOperation = {add:true,
            del:true,
            edit:true,
            multiselect:true,
            view:tjGridInit.view,
            search:tjGridInit.search,
            searchLevel:tjGridInit.searchLevel,
            toolbar:tjGridInit.toolbar,
            buttonType:tjGridInit.buttonType
        };
        TjGridView.call(this, tjGrid, operation);
        this.analyzeViewComponents();
    }

    function EasyView(tjGrid, operation) {
        this.defaultOperation = {
            add:false,
            del:false,
            edit:false,
            multiselect:false,
            search:false,
            view:false,
            toolbar:false
        };
        TjGridView.call(this, tjGrid, operation);
        this.analyzeViewComponents();
    }

    function OnlyCheckView(tjGrid, operation) {
        this.defaultOperation = {
            add:false,
            del:false,
            edit:false,
            multiselect:false,
            search:false,
            view:true,
            toolbar:tjGridInit.toolbar,
            buttonType:tjGridInit.buttonType
        };
        TjGridView.call(this, tjGrid, operation);
        this.analyzeViewComponents();
    }

    function NoSearchView(tjGrid, operation) {
        this.defaultOperation = {
            add:true,
            del:true,
            edit:true,
            multiselect:true,
            search:false,
            view:tjGridInit.view,
            toolbar:tjGridInit.toolbar,
            buttonType:tjGridInit.buttonType
        };
        TjGridView.call(this, tjGrid, operation);
        this.analyzeViewComponents();
    }

    function TjDynamicColumnsDiv(tjGridView) {
        this.tableId = tjGridView.table.id;
        this.id = "dynamic-" + tjGridView.table.id;
        this.initDynamicColumnsDiv = function() {
            $('#jqgh_' + this.tableId + '_rn').addClass('dynamicDiv');
            var html = '<div id="'+this.id+'"><table>';
            $.each(tjGridView.tjGrid.colModelsDetail.colModels,function(i,n){
                //做以下处理是为了排除ID
                if ((i + 1)%2 == 0){
                    html += '<tr>';
                }
                if (!(n.options.name == 'id') && !(n.options.header == 'id')){
                    html += '<td><input type="checkbox" name="dynamicCheckbox" value="'+n.options.name+'"/>'+n.options.header+'</td>';
                }
                if ((i + 1)%2 != 0) {
                    html += '</tr>';
                }
            });
            html+= '</table></div>';
            $(tjGridView.tjGrid.target).after(html);
            var $this = this;
            $('#jqgh_' + this.tableId + '_rn').click(function(){//自定义列展示按钮的点击事件
                var top = $(this).offset().top - $(document).scrollTop();
                var left = parseInt($(this).offset().left) + parseInt($(this).width()) + 5;
                $('#'+$this.id).dialog('option', 'position', [left,top] );
                $('#'+$this.id).dialog('open');
            });
            $('input[name="dynamicCheckbox"]').click(function(){//checkbox的点击事件
                if ($(this).attr('checked') == 'checked'){
                    //显示列
                    $('#'+$this.tableId).jqGrid('showCol',$(this).val());
                }else {
                    //隐藏列
                    $('#'+$this.tableId).jqGrid('hideCol',$(this).val());
                }
                $('#'+$this.tableId).setGridWidth(tjGridInit.gridWidth());
            });
            $.each($.evalJSON(tjGridView.tjGrid.dynamicColumns),function(i,n){//初始化选中状态
                $('input[name="dynamicCheckbox"][value="'+i+'"]').attr('checked','checked');
            });
            $('#'+this.id).dialog({
                height: 'auto',
                width: 200,
                autoOpen:false,
                resizable: false,
                buttons: {
                    "确定": function() {
                        var dynamicColumnsResult = '';
                        $('input[name="dynamicCheckbox"]:checked').each(function(){
                            dynamicColumnsResult +=  $(this).val() + ',';
                        });
                        $.ajax({
                            type:"POST",
                            url: tjGridView.tjGrid.dynamicUrl,
                            data: {dynamicColumnsResult : dynamicColumnsResult.substring(0, dynamicColumnsResult.length - 1)},
                            dataType:"json"
                        });
                        $('#'+$this.id).dialog('close');
                    },
                    "关闭":function(){
                        $('#'+$this.id).dialog('close');
                    }
                }
            });
        }
        this.initDynamicColumnsDiv();
    }

    function TjColModel(options) {
        this.options = $.extend({
            name:null, //标示
            header:null, //标头
            sortable:true,
            editable:true,
            verify:null,
            width:0,
            hidden:false,
            canSubmit:true, //是否提交数据
            defaultVal:null, //输入框的默认值
            inputType:'input', //下拉选使用
            zurl:null, //如果是auto的话，这里输入自动完成的地址
            items:[], //如果是多选的话这里输入选择项
            dateFmt:null, //这两个属性日期框架使用
            now:null, //这两个属性日期框架使用
            //这两个属性级联下拉选使用
            related:null, //被关联的属性比如dept
            relate:null, //关联的属性比如group
            relateUrl:null//关联的url
        }, options || {});
    }

    function TjGridItem(options) {
        this.item = {
            name:options.name,
            index:options.name,
            align:'center',
            hidden:options.hiddenInTable == undefined ? false : options.hiddenInTable,
            width:options.width
        };
    }

    function TjPageBar(tjGridView) {
        var tjGrid = tjGridView.tjGrid;
        this.id = 'grid-page-' + tjGrid.id;
        this.init = function () {
            $(tjGrid.target).append('<div id="' + this.id + '"></div>');
        }
        this.init();
    }

    function TjTable(tjGridView) {
        var tjGrid = tjGridView.tjGrid;
        this.id = 'grid-table-' + tjGrid.id;
        this.searchDateDivId = this.id + 'saarchDateDiv';
        this.initTable = function () {
            $(tjGrid.target).prepend('<table id="' + this.id + '" ></table>');
            if (tjGridView.isInnerBtn()) {//如果按钮内置
                this.handleInnerBtnType(tjGrid.colModelsDetail);
            }
            $('#' + this.id).jqGrid({
                url:tjGrid.loadUrl.content,
                colNames:tjGrid.colModelsDetail.colNames,
                colModel:tjGrid.colModelsDetail.colItems,
                datatype:'json',
                mtype:'post',
                rowNum:tjGridView.operation.rowNum || tjGridInit.rowNum,
                viewrecords:true,
                jsonReader:{
                    root:"data",
                    repeatitems:false
                },
                rownumbers:true,
                toppager:tjGridView.operation.toppager || tjGridInit.toppager,
                gridview:true,
                height:'100%',
                pager:'#' + tjGridView.pageBar.id,
                rowList:tjGridInit.rowList,
                sortorder:'asc',
                viewsortcols:[true, 'horizontal', true],
                caption:tjGrid.name,
                toolbar:tjGridView.operation.toolbar || tjGridInit.toolbar,
                multiselect:function () {
                    if (tjGridView.operation.buttonType != 'outer') {
                        return false;
                    } else {
                        if (tjGridView.operation.multiselect == undefined) {
                            return tjGridInit.multiselect;
                        } else {
                            return tjGridView.operation.multiselect;
                        }
                    }
                }()
            });
            var $this = this;
            $('#tb_' + this.id).css('height', tjGridInit.bottomHeight);//toolbar高度
            $(window).bind('resize', function(){//表格宽度
                $('#' + $this.id).jqGrid('setGridWidth', tjGridView.operation.width || tjGridInit.gridWidth());
            }).trigger('resize');
            if (tjGridView.operation.search) {//搜索栏按钮
                this.initFilter();
                this.initNav();
                if (tjGridView.operation.search == 'bottom') {
                    this.initBottomSearchButton();
                }
                if (tjGridView.operation.searchLevel == 'pro'){
                    this.initProSearchBar();
                }
            }
        };
        this.initFilter = function () {
            $('#' + this.id).jqGrid('filterToolbar', {stringResult:true, searchOnEnter:true})[0].toggleToolbar();
        };
        this.initNav = function () {
            $('#' + this.id).jqGrid('navGrid', '#' + tjGridView.pageBar.id, {del:false, add:false, edit:false, search:false}, {}, {}, {}, {multipleSearch:true});
        };
        this.isFilterToolbarVisible = function() {
            return $('#' + tjGrid.id).find('tr.ui-search-toolbar:visible').length > 0 ? true:false;
        };
        this.initBottomSearchButton = function () {
            var $this = this;
            $('#' + this.id).jqGrid('navButtonAdd', '#' + tjGridView.pageBar.id, {caption:"查询", title:"分类查询", buttonicon:'ui-icon-pin-s',
                onClickButton:function () {
                    if ($this.isFilterToolbarVisible()){//如果可见，则接下来是隐藏操作，需要把所有搜索记录清空
                        $('#' + $this.id)[0].clearToolbar();
                    }
                    $('#' + $this.id)[0].toggleToolbar();
                }
            });
        };
        this.initSearchSelect = function(oldInput, colModel,outerDiv) {
            var $this = this;
            if (colModel.related){//如果级联别的select则搜索时当成input来搜索

            }else {//如果不是
                oldInput.remove();
                var html = '<select name="'+colModel.name+'" style="width:100%;" id="'+oldInput.attr('id')+'">';
                html += '<option value="">请选择</option>';
                var items = colModel.items;
                for (var i in items) {
                    if (colModel.name.indexOf('.') != -1){//说明这个是级联的属性
                        html += '<option value="' + items[i].name + '">' + items[i].name + '</option>';
                    }else {//说明是自身属性，也就是说option中只有value值有效
                        html += '<option value="' + items[i].value + '">' + items[i].name + '</option>';
                    }
                }
                html +='</select>';
                outerDiv.html(html);
                outerDiv.find('select').change(function(){
                    $('#' + $this.id).jqGrid('filterToolbar')[0].triggerToolbar();
                });
            }
        };
        this.initSearchAuto = function(oldInput, colModel) {
            oldInput.attr('ztype','auto');
            if (colModel.url){
                oldInput.attr('url',colModel.url);
                oldInput.parent().init_style();
            }
        };
        this.initSearchDate = function (oldInput,tjGridView) {
            var $this = this;
            oldInput.attr('readonly','readonly');
            if ($('#'+ this.searchDateDivId).length == 0){
                var html = '<div id="'+this.searchDateDivId +'"><table class="' + tjGridInit.inputTableClass + '">';
                html += '<tr><td  class="' + tjGridInit.inputTableLabelClass + '" style="width:70px;" rowspan="2">选择时间</td><td><input type="radio" name="searchDate" value="month"/>本月</td></tr>';
                html += '<tr><td><input type="radio" name="searchDate" value="year"/>本年</td></tr>';
                html += '<tr><td class="' + tjGridInit.inputTableLabelClass + '" style="width:70px;">选择时间段</td><td><input id="'+this.searchDateDivId+'_startdate" type="text" ztype="date" mode="startdate" style="width:80px"/>&nbsp;&nbsp;--&nbsp;&nbsp;<input id="'+this.searchDateDivId+'_enddate" type="text" ztype="date" mode="enddate" style="width:80px"/></td></tr>';
                html += '<tr><td colspan="2" style="text-align:right;"><input type="button" id="'+this.searchDateDivId +'_confirm" value="确定"/><input type="button" id="'+this.searchDateDivId +'_cancel" value="取消"/></td></tr>';
                html += '</table></div>';
                $('#'+ this.id).after(html);
                $('#'+ this.searchDateDivId).init_style();
                $('#'+ this.searchDateDivId +'_startdate').add('#'+ this.searchDateDivId +'_enddate').focus(function(){//聚焦到日期段的input时取消radio的选中状态
                    $('#' + $this.searchDateDivId).find('[type="radio"]:checked').attr('checked', false);
                });
                $('#'+ this.searchDateDivId +'_confirm').click(function(){//日期框的确定按钮，选择radio中的一个，或是日期段
                    if ($('#' + $this.searchDateDivId).find('[type="radio"]:checked').length>0){
                        $('#' + $this.searchDateDivId).data('target').val($('#' + $this.searchDateDivId).find('[type="radio"]:checked').parent().text());
                    }else {
                        if ($('#' + $this.searchDateDivId+'_startdate').val() != '' ||  $('#' + $this.searchDateDivId+'_enddate').val() != ''){
                            $('#' + $this.searchDateDivId).data('target').val($('#' + $this.searchDateDivId+'_startdate').val() + ' 至 ' + $('#' + $this.searchDateDivId+'_enddate').val());
                        }
                    }
                    $('#' + $this.id).jqGrid('filterToolbar')[0].triggerToolbar();
                    $('#' + $this.searchDateDivId).dialog('close');
                });
                $('#'+ this.searchDateDivId +'_cancel').click(function(){//日期框的关闭按钮
                    $this.cancelSearchDateDiv($('#' + $this.searchDateDivId).data('target'));
                });
                $('#' + this.searchDateDivId).dialog({
                    resizable:false,
                    autoOpen:false,
                    height:'auto',
                    width:320,
                    title:'请选择时间段',
                    modal:false
                });
            }
            var $innerThis = this;
            oldInput.click(function(){
                var top = $(this).offset().top - $(document).scrollTop() + parseInt($(this).height()) + 5;
                var left = parseInt($(this).offset().left);
                $('#'+$this.searchDateDivId).dialog('option', 'position', [left,top] );
                if ($(this).val() != ''){//如果不为空则回填
                    var value = $(this).val();
                    if (value == '本月'){
                        $('#' + $this.searchDateDivId).find('[value="month"]').attr('checked','checked');
                    }else if (value == '本年'){
                        $('#' + $this.searchDateDivId).find('[value="year"]').attr('checked','checked');
                    }else {
                        if (value.indexOf('至') != -1){
                            $('#' + $this.searchDateDivId + '_startdate').val($.trim(value.substring(0,value.indexOf('至'))));
                            $('#' + $this.searchDateDivId + '_enddate').val($.trim(value.substring(value.indexOf('至') + 1)));
                        }
                    }
                }
                $('#' + $this.searchDateDivId).dialog('open');
                $('#' + $this.searchDateDivId).data('target', $(this));
            });
        };
        this.initProSearchBar = function (){
            var $this = this;
            //如果是操作列或ID列则去掉搜索栏
            $('[id="gs_id"]').remove();
            if ($('[id="gs_myac"]'))  $('[id="gs_myac"]').remove();
            //根据不同类型重新设置不同的搜索框
            var colModels= tjGrid.colModelsDetail.colModels;
            for (var i in colModels){
                var colModel= colModels[i].options;
                var searchBarItemId = 'gs_'+colModel.name;
                var oldInput = $('[id="'+searchBarItemId+'"]');
                var outerDiv = $('[id="'+searchBarItemId+'"]').parent();
                oldInput.focus(function(){
                    $this.cancelSearchDateDiv();
                });
                switch (colModel.inputType){
                    case 'select':
                        this.initSearchSelect(oldInput,colModel,outerDiv);
                        break;
                    case 'auto':
                        this.initSearchAuto(oldInput, colModel);
                        break;
                    case 'input':

                        break;
                    case 'date':
                        this.initSearchDate(oldInput,tjGridView);
                        break;
                }
            }
        };
        this.cancelSearchDateDiv = function(oldInput) {
            $('#' + this.searchDateDivId).find('[type="radio"]:checked').attr('checked', false);
            $('#' + this.searchDateDivId+'_startdate').val('');
            $('#' + this.searchDateDivId+'_enddate').val('');
            $('#' + this.searchDateDivId).dialog('close');
            if (oldInput) {
                oldInput.val('');
                $('#' + this.id).jqGrid('filterToolbar')[0].triggerToolbar();
            }
        };
        this.getSelected = function () {
            if ($('#' + this.id).jqGrid('getGridParam', 'multiselect')) {
                return $('#' + this.id).jqGrid('getGridParam', 'selarrrow');
            } else {
                if (!($('#' + this.id).jqGrid('getGridParam', 'selrow'))) {
                    return [];
                } else {
                    return  [$('#' + this.id).jqGrid('getGridParam', 'selrow')];
                }
            }
        };
        this.showMessage = function (message) {
            $('#tb_' + this.id).html('<font color="#ffb400">' + message + '</font>');
        };
        this.handleInnerBtnType = function (colModelsDetail) {
            colModelsDetail.colNames.push('操作');
            colModelsDetail.colItems.push({name:'myac', width:tjGridView.operation.buttonType[1] || 120, fixed:true, sortable:false, resize:false, formatter:'actions'});
            var $this = this;
            $.fn.fmatter.actions = function (cellval, opts, rwd) {//重写源码中的actions方法
                var html = '';
                if (tjGridView.operation['edit']) {
                    html += '<span id="inner-btn-edit-' + $this.id + '_' + rwd.id + '" style="cursor: pointer">【编辑】</span>&nbsp;';
                    $('#inner-btn-edit-' + $this.id + '_' + rwd.id).live('click', function () {
                        tjGridView.inputDialog.beforeEdit($this.getSelected());
                        tjGridView.inputDialog.open();
                    });
                }
                if (tjGridView.operation['del']) {
                    html += '<span id="inner-btn-del-' + $this.id + '_' + rwd.id + '" style="cursor: pointer">【删除】</span>&nbsp;';
                    $('#inner-btn-del-' + $this.id + '_' + rwd.id).live('click', function () {
                        tjConfirm('确认要删除所选的这条数据?', function (result) {
                            result && $this.deleteData($this.getSelected());
                        });
                    });
                }
                if (tjGridView.operation['view']) {
                    html += '<span id="inner-btn-view-' + $this.id + '_' + rwd.id + '" style="cursor: pointer">【查看】</span>&nbsp;';
                    $('#inner-btn-view-' + $this.id + '_' + rwd.id).live('click', function () {
                        tjGridView.viewDialog.initViewData();
                    });
                }
                if (tjGridView.operation['customBtns']){
                    for (var i=0;i < tjGridView.operation['customBtns'].length ; i++) {
                        var index = i;//这就是闭包的特性，太可怕了
                        var customBtn = tjGridView.operation['customBtns'][index];
                        if (!customBtn.buttonType && tjGridInit.buttonType == 'inner' || customBtn.buttonType == 'inner'){
                            html += '<span id="inner-btn-custom_' + index + '-' + $this.id + '_' + rwd.id + '" style="cursor: pointer">【'+customBtn.name+'】</span>&nbsp;';
                            $('#inner-btn-custom_' + i + '-' + $this.id + '_' + rwd.id).live('click', function () {
                                if (customBtn.isSelected){
                                    tjGridView.customButtonInnerMap[index.toString()].beforeEdit();
                                }
                                tjGridView.customButtonInnerMap[index.toString()].open();
                            });
                        }
                    }
                }
                return "<div style='margin-left:8px;'>" + html + "</div>";
            };
        };
        this.deleteData = function (delArray) {
            var $this = this;
            $.ajax({
                type:"POST",
                url:tjGridView.tjGrid.delUrl.content,
                data:{delIds:$.toJSON(delArray)},
                dataType:"json",
                async: false,
                success:function (data) {
                    $this.showMessage(data.result ? '删除成功' : '删除失败');
                    if (data.result) {//清空选中列，从界面上移除已删除的数据
                        $('#' + $this.id).jqGrid('resetSelection');
                        for(var i in delArray){
                            $('#' + $this.id).jqGrid('delRowData', delArray[i]);
                        }
                    }
                }
            });
        };
        this.reload = function() {
            $('#'+this.id).jqGrid().trigger("reloadGrid");
        };
        this.initTable();
    }

    function TjToolbar(tjGridView) {
        this.tjGridView = tjGridView;
        this.id = 'grid-toolbar-' + tjGridView.tjGrid.id;
        this.initToolbar = function () {
            $('#t_' + tjGridView.table.id).append('<div class="gridButton" id="' + this.id + '"></div>');
            this.createButtons();
        };
        this.createButtons = function () {
            if (this.tjGridView.operation['search'] == 'top') {
                this.tjGridView.buttonList.push(new TjButtonSearch(this));
            }
            if (this.tjGridView.operation['view']) {
                if (!this.tjGridView.isInnerBtn()) this.tjGridView.buttonList.push(new TjButtonView(this));
            }
            if (this.tjGridView.operation['add']) {
                this.tjGridView.buttonList.push(new TjButtonAdd(this));
            }
            if (this.tjGridView.operation['edit']) {
                if (!this.tjGridView.isInnerBtn()) this.tjGridView.buttonList.push(new TjButtonEdit(this));
            }
            if (this.tjGridView.operation['del']) {
                if (!this.tjGridView.isInnerBtn()) this.tjGridView.buttonList.push(new TjButtonDel(this));
            }
            //是否有自定义按钮
            if (this.tjGridView.operation['customBtns']) {
                for (var i=0;i < this.tjGridView.operation['customBtns'].length ; i++) {
                    var customBtn = this.tjGridView.operation['customBtns'][i];
                    if (!customBtn.buttonType && tjGridInit.buttonType == 'outer' || customBtn.buttonType == 'outer'){
                        var tjButtonCustom = new TjButtonCustom(this, customBtn.name,customBtn.type, customBtn.url, customBtn.isSelected,customBtn.btnClass);
                        var tjCustomDialog = new TjCustomDialog(this.tjGridView,customBtn.url, customBtn.type, customBtn.width, customBtn.height);
                        this.tjGridView.customButtonMap[tjButtonCustom] = tjCustomDialog;
                    }
                }
            }
            $('#' + this.id).init_style();
        };
        this.initToolbar();
    }

    function TjButton(toolbar) {
        this.toolbar = toolbar;
        this.getId = function () {
            return   'grid-' + this.name + '-' + toolbar.id.substring(13);
        };
        this.getInputDialog = function () {
            return toolbar.tjGridView.inputDialog;
        };
        this.getViewDialog = function () {
            return toolbar.tjGridView.viewDialog;
        };
        this.getMultiDialog = function () {
            return toolbar.tjGridView.multiDialog;
        };
        this.getCustomDialog = function() {
            return toolbar.tjGridView.customButtonMap[this];
        };
        this.initButton = function () {
            $('#' + this.toolbar.id).append('<button id="' + this.getId() + '" type="button" ztype="button" width="325"><span class="'+(this.btnClass || ('style_' + this.name + 'Button'))+'">&nbsp;&nbsp;&nbsp;&nbsp;</span>' + this.typeCN + '</button>');
            var $this = this;
            $('#' + this.getId()).click(function () {
                $this.clickFunc()
            });
        };
    }

    function TjButtonAdd(toolbar) {
        this.name = 'add';
        this.typeCN = '新增';
        this.clickFunc = function () {
            this.getInputDialog().open();
        };
        TjButton.call(this, toolbar);
        this.initButton();
    }

    function TjButtonEdit(toolbar) {
        this.name = 'edit';
        this.typeCN = '编辑';
        this.clickFunc = function () {
            var selected = toolbar.tjGridView.table.getSelected();
            if (selected.length == 0) {
                tjAlert('请选择需要修改的数据');
                return;
            } else if (selected.length == 1) {
                this.getInputDialog().beforeEdit(selected);
                this.getInputDialog().open();
            } else { //多选编辑
                if(toolbar.tjGridView.tjGrid.inputUrl.content){
                   tjAlert('暂时不支持多选编辑功能');
                }else {
                    this.getMultiDialog().beforeEdit(selected);
                    this.getMultiDialog().open();
                }
            }
        };
        TjButton.call(this, toolbar);
        this.initButton();
    }

    function TjButtonView(toolbar) {
        this.name = 'view';
        this.typeCN = '查看';
        this.clickFunc = function () {
            this.getViewDialog().initViewData();
        };
        TjButton.call(this, toolbar);
        this.initButton();
    }

    function TjButtonDel(toolbar) {
        this.name = 'del';
        this.typeCN = '删除';
        this.clickFunc = function () {
            var $this = this;
            var selected = toolbar.tjGridView.table.getSelected();
            if (selected.length == 0) {
                tjAlert('请选择要删除的数据');
                return;
            } else {//多选删除
                tjConfirm('确认要删除所选的' + selected.length + '条数据?', function (result) {//在方法中重新取选择数，否则会造成不同步的问题
                    result && toolbar.tjGridView.table.deleteData(toolbar.tjGridView.table.getSelected());
                });
            }
        };
        TjButton.call(this, toolbar);
        this.initButton();
    }

    function TjButtonSearch(toolbar) {
        this.name = 'search';
        this.typeCN = '查询';
        this.clickFunc = function () {
            if (toolbar.tjGridView.table.isFilterToolbarVisible()){//如果可见，则接下来是隐藏操作，需要把所有搜索记录清空
                $('#' + toolbar.tjGridView.table.id)[0].clearToolbar();
            }
            $('#' + toolbar.tjGridView.table.id)[0].toggleToolbar();
        };
        TjButton.call(this, toolbar);
        this.initButton();
    }

    function TjButtonCustom(toolbar, typeCN,type, url,isSelected,btnClass) {
        TjButton.call(this, toolbar);
        this.btnClass = btnClass;
        this.id = null;
        this.getId = function () {
            if (!this.id) {
                var length = $('[id^="' + 'grid-' + this.name + '-' + toolbar.id.substring(13) + '"]').length;
                this.id = 'grid-' + this.name + '-' + toolbar.id.substring(13) + "_" + (length + 1);
            }
            return this.id;
        };
        this.name = 'custom';
        this.typeCN = typeCN;
        this.clickFunc = function () {
            if (isSelected){
                var selected = toolbar.tjGridView.table.getSelected();
                if (selected.length == 0 || selected.length > 1) {
                    tjAlert('请选择需要1条需要操作的数据');
                    return;
                } else if (selected.length == 1) {
                    this.getCustomDialog().beforeEdit();
                }
            }
            this.getCustomDialog().open();
        };
        this.initButton();
    }

    function TjDialog(tjGridView) {
        this.getGridId = function () {
            return tjGridView.tjGrid.id;
        };
        this.getId = function () {
            return  'grid-dialog-' + this.name + '-' + this.getGridId();
        };
        this.getGridTableId = function () {
            return tjGridView.table.id;
        };
        this.cancelSelectedRows = function () {
            $('#' + tjGridView.table.id).jqGrid('resetSelection');
        };
    }

    function TjViewDialog(tjGridView) {
        this.name = 'view';
        this.getHeader = function () {
            return '查看' + tjGridView.tjGrid.name;
        };
        this.getCloseButtonId = function () {
            return  'grid-dialog-' + this.name + '-close-' + this.getGridId();
        };
        this.initDialog = function () {
            if ($('#' + this.getId()).length == 0) {//如果没有初始化就进行初始化
                var html = '<div id="' + this.getId() + '" style="display:none;" >';
                html += '<input type="hidden" name="id"/>'
                html += '<table class="' + tjGridInit.viewTableClass + '" width="100%" border="0" cellpadding="0" cellspacing="0"></table>';
                html += '<div class="form_submitDiv">';
                html += '<input type="button" id="' + this.getCloseButtonId() + '" value="关闭" />';
                html += '</div></div>';
                $('#' + this.getGridId()).after(html);
                this.initViewTable();
                var $this = this;
                $('#' + this.getId()).dialog({
                    resizable:false,
                    autoOpen:false,
                    height:'auto',
                    width:tjGridInit.dialogWidth,
                    modal:true,
                    close:function () {
                        $this.cancelSelectedRows();
                    }
                });
                //关闭按钮要执行的内容
                $('#' + this.getCloseButtonId()).click(function () {
                    $this.close();
                    $this.cancelSelectedRows();
                });
            }
        };
        this.clearEachElement = function () {
            $('#' + this.getId()).find('table:first tr td:eq(1)').empty();
        };
        this.initViewData = function () {
            var selected = tjGridView.table.getSelected();
            if (selected.length == 1) {
                var viewValue = $('#' + this.getGridTableId()).getRowData(selected[0]);
                for (var i in viewValue) {
                    $('label[name="view_' + i + '"]').parents('tr:first').find('td:eq(1)').html(viewValue[i]);
                }
                this.open();
            } else {
                tjAlert('请选择一条记录');
                return;
            }
        };
        this.initViewTable = function () {
            var inputTable = $('#' + this.getId()).find('table:first');
            var colModels = tjGridView.tjGrid.colModelsDetail.colModels;
            for (var i in colModels) {
                this.appendEachElement(colModels[i], inputTable);
            }
        };
        this.appendEachElement = function (colModel, inputTable) {//把每一个element附在dialog里
            var html = '';
            if (colModel.options.hidden) {
                html += '<tr style="display:none;">';
            } else {
                html += '<tr>';
            }
            html += '<td class="' + tjGridInit.viewTableLabelClass + '" style="' + tjGridInit.viewTableLabelWidth + '"><label name="view_' + colModel.options.name + '">' + colModel.options.header + '：</label></td>';
            html += '<td></td></tr>';
            inputTable.append(html);
        };
        this.open = function () {
            $('#' + this.getId()).dialog('option', 'title', this.getHeader());
            $('#' + this.getId()).dialog('open');
        };
        this.close = function () {
            $('#' + this.getId()).dialog('close');
        };
        TjDialog.call(this, tjGridView);
        this.initDialog();
    }

    function TjInputDialog(tjGridView) {
        this.name = 'input';
        this.elementList = [];
        this.getHeader = function () {
            return (this.isEdit() ? '修改' : '添加') + tjGridView.tjGrid.name;
        }
        this.getFormId = function () {
            return  'grid-dialog-' + this.name + '-form-' + this.getGridId();
        };
        this.getActionUrl = function () {
            return tjGridView.tjGrid.saveUrl.content;
        };
        this.getSaveButtonId = function () {
            return  'grid-dialog-' + this.name + '-save-' + this.getGridId();
        };
        this.getCloseButtonId = function () {
            return  'grid-dialog-' + this.name + '-close-' + this.getGridId();
        };
        this.isEdit = function () {
            return $('#' + this.getFormId()).find('[name="id"]').val() != ""
        };
        this.isCountinue = function () {
            return $('#' + this.getFormId()).find('[id="continual-add-div"] input[type="checkbox"]').attr('checked');
        };
        this.initForm = function () {
            var $this = this;
            $('#' + this.getFormId()).ajaxForm({
                type:"post",
                dataType:'json',
                beforeSubmit:function () {
                    return  $('#' + $this.getFormId()).data('tjForm').checkSubmit();
                },
                success:function (data) {
                    var name = tjGridView.tjGrid.name + $('#' + $this.getFormId()).find('[name="name"]').val() || '';
                    tjGridView.table.showMessage(name + ($this.isEdit() ? "修改" : "添加") + (data.result ? "成功" : "失败"));
                    if (!$this.isCountinue()) {
                        $this.close();
                    }
                    tjGridView.table.reload();
                }
            });
        };
        this.initDialog = function () {
            if ($('#' + this.getId()).length == 0) {//如果没有初始化就进行初始化
                var html = '<div id="' + this.getId() + '" style="display:none;" >';
                html += '<form id="' + this.getFormId() + '" name="' + this.getFormId() + '" action="' + this.getActionUrl() + '" style="border:0;margin:0;padding:0;">';
                html += '<table class="' + tjGridInit.inputTableClass + '" width="100%" border="0" cellpadding="0" cellspacing="0"></table>';
                html += '<div class="form_submitDiv">';
                if (!this.isEdit()){
                    html += '<div id="continual-add-div" style="float:left;">是否连续添加:<input type="checkbox" name="checkbox" ztype="checkbox"/></div>';
                }
                html += '<input type="submit" id="' + this.getSaveButtonId() + '" value="保存" /><input type="button" id="' + this.getCloseButtonId() + '" value="关闭" />';
                html += '</div></form></div>';
                $('#' + this.getGridId()).after(html);
                this.initEachElement();
                var $this = this;
                $('#' + this.getId()).dialog({
                    resizable:false,
                    autoOpen:false,
                    height:'auto',
                    width:tjGridInit.dialogWidth,
                    modal:true,
                    close:function () {
                        $this.clearEachElement();
                        $this.cancelSelectedRows();
                    }
                });
                //关闭按钮要执行的内容
                $('#' + this.getCloseButtonId()).click(function () {
                    $this.close();
                    $this.clearEachElement();
                    $this.cancelSelectedRows();
                });
                this.initForm();//初始化表格
            }
        };
        this.initEachElement = function () {
            var tjGridId = tjGridView.tjGrid.id;
            var colModels = tjGridView.tjGrid.colModelsDetail.colModels;
            var inputTable = $('#' + this.getId()).find('table:first');
            for (var i in colModels) {
                switch (colModels[i].options.inputType) {
                    case 'input':
                        this.appendEachElement(new TjEleInput(colModels[i].options, tjGridId), inputTable);
                        break;
                    case 'select':
                        this.appendEachElement(new TjEleSelect(colModels[i].options, tjGridId), inputTable);
                        break;
                    case 'checkbox':
                        this.appendEachElement(new TjEleCheckbox(colModels[i].options, tjGridId), inputTable);
                        break;
                    case 'textarea':
                        this.appendEachElement(new TjEleTextarea(colModels[i].options, tjGridId), inputTable);
                        break;
                    case 'date':
                        this.appendEachElement(new TjEleDate(colModels[i].options, tjGridId), inputTable);
                        break;
                    case 'auto':
                        this.appendEachElement(new TjEleAuto(colModels[i].options, tjGridId), inputTable);
                        break;
                }
            }
            $('#' + this.getId()).init_style();
        };
        this.clearEachElement = function () {
            for (var i in this.elementList) {
                this.elementList[i].clear();
            }
        };
        this.appendEachElement = function (tjElement, inputTable) {//把每一个element附在dialog里
            this.elementList.push(tjElement);
            var html = '';
            if (tjElement.isHidden()) {
                html += '<tr style="display:none;">';
            } else {
                html += '<tr>';
            }
            html += '<td class="' + tjGridInit.inputTableLabelClass + '" style="' + tjGridInit.inputTableLabelWidth + '"><label for="' + tjElement.getName() + '">' + tjElement.getHeader() + '：</label></td>';
            html += '<td>' + tjElement.getElementHtml() + '</td></tr>';
            inputTable.append(html);
            if (tjElement.isRelate()) {//如果是被级联的，需要绑定事件
                tjElement.handleRelateEvent();
            }
        };
        this.beforeEdit = function (id) {
            var editValue = $('#' + this.getGridTableId()).getRowData(id);
            $('#' + this.getFormId()).find('[name="id"]').val(id);
            for (var i in this.elementList) {
                (this.elementList)[i].setValue(editValue[(this.elementList)[i].getName()]);//赋值
            }
        };
        this.open = function () {
            $('#' + this.getId()).dialog('option', 'title', this.getHeader());
            $('#' + this.getId()).dialog('open');
            $('#' + this.getFormId()).form();
        };
        this.close = function () {
            $('#' + this.getId()).dialog('close');
            $('#' + this.getFormId()).removeTip();
            $('input[ztype="auto"]').each(function () {
                $(this).removeData('editRelatedVal');
            });
        };
        TjDialog.call(this, tjGridView);
        this.initDialog();
    }

    function TjMultiDialog(tjGridView) {
        this.name = 'multi';
        this.elementMap = {};
        this.getHeader = function () {
            return '多选编辑' + tjGridView.tjGrid.name;
        }
        this.getFormId = function () {
            return  'grid-dialog-muilt' + this.name + '-form-' + this.getGridId();
        };
        this.getActionUrl = function () {
            return tjGridView.tjGrid.multiUrl.content;
        };
        this.getSaveButtonId = function () {
            return  'grid-dialog-mutli' + this.name + '-save-' + this.getGridId();
        };
        this.getCloseButtonId = function () {
            return  'grid-dialog-mutli' + this.name + '-close-' + this.getGridId();
        };
        this.initForm = function () {
            var $this = this;
            $('#' + this.getFormId()).form();
            $('#' + this.getSaveButtonId()).click(function () {
                if ($('#' + $this.getFormId()).data('tjForm').checkSubmit()) {
                    var result = {};
                    result.selectedIds = $('#' + $this.getFormId()).find('[name="selectedIds"]').val();
                    var multiArray = []
                    $('#' + $this.getFormId()).find('input[type="checkbox"]:checked').each(function () {
                        var multiObj = {};
                        var elementId = $(this).attr('id').substring(3);
                        multiObj['property'] = $('[id="' + elementId + '"]').attr('name');
                        multiObj['value'] = $('[id="' + elementId + '"]').val();
                        if ($('[id="' + elementId + '"]').attr('ztype') == 'date'){
                            multiObj['propType'] = 'date';
                            multiObj['propMode'] = $('[id="' + elementId + '"]').attr('mode');
                        }
                        multiArray.push(multiObj);
                    });
                    result.multiArray = multiArray;
                    $.ajax({
                        url:$this.getActionUrl() + '?rd=' + Math.random(),
                        type:'post',
                        async:false,
                        data:{q:$.toJSON(result)},
                        dataType:'json',
                        success:function (data) {
                            tjGridView.table.showMessage('共' + tjGridView.table.getSelected().length + '条' + tjGridView.tjGrid.name + '编辑' + (data.result ? "成功" : "失败"));
                            $this.close();
                            tjGridView.table.reload();
                        }
                    });
                }
            });
        };
        this.initDialog = function () {
            if ($('#' + this.getId()).length == 0) {//如果没有初始化就进行初始化
                var html = '<div id="' + this.getId() + '" style="display:none;" >';
                html += '<form id="' + this.getFormId() + '" name="' + this.getFormId() + '" action="' + this.getActionUrl() + '" style="border:0;margin:0;padding:0;">';
                html += '<input name="selectedIds" type="hidden" value=""/>';
                html += '<table class="' + tjGridInit.inputTableClass + '" width="100%" border="0" cellpadding="0" cellspacing="0"></table>';
                html += '<div class="form_submitDiv">';
                html += '<input type="button" id="' + this.getSaveButtonId() + '" value="保存" /><input type="button" id="' + this.getCloseButtonId() + '" value="关闭" />';
                html += '</div></form></div>';
                $('#' + this.getGridId()).after(html);
                this.initEachElement();
                var $this = this;
                $('#' + this.getId()).dialog({
                    resizable:false,
                    autoOpen:false,
                    height:'auto',
                    width:400,
                    modal:true,
                    close:function () {
                        $this.clearEachElement();
                        $this.cancelSelectedRows();
                    }
                });
                //关闭按钮要执行的内容
                $('#' + this.getCloseButtonId()).click(function () {
                    $this.close();
                    $this.clearEachElement();
                    $this.cancelSelectedRows();
                });
                this.initForm();//初始化表格
            }
        };
        this.initEachElement = function () {
            var tjGridId = tjGridView.tjGrid.id;
            var colModels = tjGridView.tjGrid.colModelsDetail.colModels;
            var inputTable = $('#' + this.getId()).find('table:first');
            var $this = this;
            $.each(colModels, function (index, colModel) {
                switch (colModel.options.inputType) {
                    case 'input':
                        $this.appendEachElement(new TjEleInput(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                    case 'select':
                        $this.appendEachElement(new TjEleSelect(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                    case 'checkbox':
                        $this.appendEachElement(new TjEleCheckbox(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                    case 'textarea':
                        $this.appendEachElement(new TjEleTextarea(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                    case 'date':
                        $this.appendEachElement(new TjEleDate(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                    case 'auto':
                        $this.appendEachElement(new TjEleAuto(colModel.options, tjGridId, 'multi'), inputTable, index);
                        break;
                }
            });
            $('#' + this.getId()).init_style();
            this.bindEachCheckboxEvent();
        };
        this.bindEachCheckboxEvent = function () {
            var $this = this;
            $('#' + this.getId()).find('form tr').each(function (i) {
                $(this).find('td:first input[type="checkbox"]').click(function () {
                    var elementId = $(this).attr('id').substring(3);
                    if ($(this).attr('checked')) {
                        $this.enableOneElement(elementId);
                    } else {
                        $this.disableOneElement(elementId);
                    }
                });
            });
        };
        this.beforeEdit = function (selected) {
            var selectedIds = '';
            for (var i in selected) {
                selectedIds += selected[i] + ',';
            }
            $('#' + this.getFormId()).find('[name="selectedIds"]').val(selectedIds.substring(0, selectedIds.length - 1));
        };
        this.clearEachElement = function () {
            for (var i in this.elementMap) {
                this.elementMap[i].clear();
            }
        };
        this.appendEachElement = function (tjElement, inputTable, index) {//把每一个element附在dialog里
            this.elementMap[tjElement.getId()] = tjElement;
            var html = '';
            if (tjElement.isHidden()) {
                html += '<tr style="display:none;">';
            } else {
                html += '<tr>';
            }
            var isNotRepeat = tjElement.isNotRepeat();
            html += '<td><input type="checkbox" title="勾选之后可以进行批量编辑" id="cb_' + tjElement.getId() + '" ';
            if (isNotRepeat) html += 'disabled="disabled"';
            html += '/></td>';
            html += '<td class="' + tjGridInit.inputTableLabelClass + '" style="' + tjGridInit.inputTableLabelWidth + '"><label class="multiLabelDisabled" for="' + tjElement.getName() + '">' + tjElement.getHeader() + '：</label></td>';
            if (isNotRepeat) {
                html += '<td>不允许重复值</td></tr>';
            }else {
                html += '<td>' + tjElement.getElementHtml() + '</td></tr>';
            }
            inputTable.append(html);
            if (tjElement.isRelate()) {//如果是被级联的，需要绑定事件
                tjElement.handleRelateEvent();
            }
        };
        this.handleLabelClass = function (id, flag) {
            var $Label = $('[id="' + id + '"]').parents('tr').find('td:eq(1) label');
            flag ? $Label.addClass('multiLabelDisabled') : $Label.removeClass('multiLabelDisabled');
        };
        this.checkElement = function (elementId, flag) {
            $('[id="' + elementId + '"]').parents('tr').find('input[type="checkbox"]').attr('checked', flag);
        };
        this.disableAll = function () {
            for (var i in this.elementMap) {
                this.elementMap[i].disableElement();
                this.handleLabelClass(this.elementMap[i].getId(), true);
                this.checkElement(this.elementMap[i].getId(), false);
            }
        };
        this.enableOneElement = function (key) {
            this.elementMap[key].enableElement();
            var relatedId = this.elementMap[key].relatedId; //设置级联
            if (relatedId) {
                this.elementMap[relatedId].enableElement();
                this.handleLabelClass(relatedId, false);
                this.checkElement(relatedId, true);
            }
            this.handleLabelClass(this.elementMap[key].getId(), false);
        };
        this.disableOneElement = function (key) {
            this.elementMap[key].disableElement();
            var relateId = this.elementMap[key].relateId;//设置级联
            if (relateId) {
                this.elementMap[relateId].disableElement();
                this.handleLabelClass(relateId, true);
                this.checkElement(relateId, false);
            }
            this.handleLabelClass(this.elementMap[key].getId(), true);
        };
        this.open = function () {
            $('#' + this.getId()).dialog('option', 'title', this.getHeader());
            $('#' + this.getId()).dialog('open');
            this.disableAll();
        };
        this.close = function () {
            $('#' + this.getId()).dialog('close');
            this.disableAll();
        };
        TjDialog.call(this, tjGridView);
        this.initDialog();
    }

    function TjCustomDialog(tjGridView, url, type, width, height) {
        TjDialog.call(this, tjGridView);
        this.id = null;
        this.edit = false;
        this.isEdit = function () {
            return this.edit;
        };
        this.getId = function () {
            if (!this.id) {
                var length = $('[id^="' + 'grid-dialog-custom-' + this.getGridId() + '"]').length;
                this.id = 'grid-dialog-custom-' + this.getGridId() + "_" + (length + 1);
            }
            return this.id;
        };
        this.getHeader = function () {
            return (this.isEdit() ? '修改' : '添加') + tjGridView.tjGrid.name;
        };
        this.beforeEdit = function () {
            this.edit = true;
        };
        this.url = url;
        this.width = width || tjGridInit.dialogWidth;
        this.height = height || 'auto';
        this.type = type || 'ajax';
        this.initDialog = function () {
            if ($('#' + this.getId()).length == 0 && this.type != 'redirect') {//如果没有初始化就进行初始化
                var html = '<div id="' + this.getId() + '" style="display:none;" >';
                $('#' + this.getGridId()).after(html);
                var $this = this;
                $('#' + this.getId()).dialog({
                    resizable:false,
                    autoOpen:false,
                    height:height,
                    width:width,
                    modal:true,
                    close:function () {
                        $this.cancelSelectedRows();
                    }
                });
            }
        };
        this.open = function () {
            $('#' + this.getId()).dialog('title', this.getHeader());//设置自定义弹出框的标题
            if (!this.isEdit()) {//新增
                if (this.type == 'ajax') {//如果是ajax方式
                    $('#' + this.getId()).empty();
                    $('#' + this.getId()).load(this.url);
                    $('#' + this.getId()).dialog('open');
                } else if (this.type == 'iframe') {
                    $('#' + this.getId()).html('<iframe src="' + this.url + '" width="' + this.width + '" height="' + this.height + '" title="' + this.title + '" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" allowtransparency="yes"/>');
                    $('#' + this.getId()).dialog('open');
                } else if (this.type == 'redirect') {
                    window.location.href = this.url;
                }
            } else {
                var id = tjGridView.table.getSelected();
                var url = this.url;
                if (id.length != undefined && id.length > 1) {//暂时不支持多选
                    //todo
                } else {
                    id = id[0];
                    if (this.type == 'ajax') {//如果是ajax方式
                        $('#' + this.getId()).empty();
                        $('#' + this.getId()).load(url, {id:id});
                        $('#' + this.getId()).dialog('open');
                    } else if (this.type == 'iframe') {
                        if (url.indexOf('?') != -1) {
                            url += '&id=' + id;
                        } else {
                            url += '?id=' + id;
                        }
                        $('#' + this.getId()).html('<iframe src="' + url + '" width="' + this.width + '" height="' + this.height + '" title="' + this.title + '" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" allowtransparency="yes"/>');
                        $('#' + this.getId()).dialog('open');
                    } else if (this.type == 'redirect') {
                        if (url.indexOf('?') != -1) {
                            url += '&id=' + id;
                        } else {
                            url += '?id=' + id;
                        }
                        window.location.href = url;
                    }
                }
            }
        }
        this.initDialog();
    }

    function TjElement(colModel, tjGridId, type) {
        this.getId = function () {
            return 'grid-' + (type ? type : 'input') + '-ele-' + this.getName() + '-' + tjGridId;
        };
        this.getName = function () {
            return colModel.name;
        };
        this.getHeader = function () {
            return colModel.header;
        };
        this.isHidden = function () {
            return false || colModel.hidden;
        };
        this.isSubmitted = function () {//是否可以提交
            if (colModel.submit == undefined || colModel.submit) {
                return true;
            } else {
                return false;
            }
        }
        this.clear = function () {
            $('[id="' + this.getId() + '"]').val('');
        };
        this.setValue = function (value) {
            $('[id="' + this.getId() + '"]').val(value);
        };
        this.disableElement = function () {
            $('[id="' + this.getId() + '"]').attr('disabled', 'disabled');
        };
        this.enableElement = function () {
            $('[id="' + this.getId() + '"]').removeAttr('disabled');
        };
        this.isNotRepeat = function() {
             return colModel.verify && colModel.verify.indexOf('NotRepeat') != -1;
        },
        this.isRelate = function () {
            if (colModel.relate) {
                if (!this.triggerRalateAjax) {
                    this.triggerRalateAjax = function () {
                        var relateId = 'grid-' + (type ? type : 'input') + '-ele-' + colModel.relate + '-' + tjGridId;
                        var ajaxInit = {
                            url:colModel.relateUrl + '?rd=' + Math.random(),
                            type:'post',
                            async:false,
                            dataType:'json',
                            success:function (data) {
                                $('*[id="' + relateId + '"]').empty();
                                if (data.result) {
                                    if (data.data != '') {
                                        var array = eval(data['data']);
                                        var html = '<option value="">请选择</option>';
                                        for (var i in array) {
                                            html += '<option value="' + array[i].value + '">' + array[i].name + '</option>';
                                        }
                                        $('*[id="' + relateId + '"]').append(html);
                                    }
                                } else {
                                    var html = '<option value="">请选择</option>';
                                    $('*[id="' + relateId + '"]').append(html);
                                }
                            }
                        };
                        if (this.constructor == TjEleSelect) {
                            ajaxInit.data = {id:$('[id="' + this.getId() + '"]').val()};
                        } else if (this.constructor == TjEleAuto) {
                            ajaxInit.data = {name:$('[id="' + this.getId() + '"]').val()};
                        }
                        $.ajax(ajaxInit);
                    }
                }
                return true;
            } else {
                return false;
            }
        };
    }

    function TjEleInput(colModel, tjGridId, type) {
        this.dateFmt = undefined || colModel.dateFmt;//用于日期格式
        this.now = undefined || colModel.now;
        this.verify = undefined || colModel.verify;
        this.getElementHtml = function () {
            var html = '<input type="text" style="float:left;" id="' + this.getId() + '" ';
            if (this.isSubmitted()) html += 'name="' + this.getName() + '" ';
            if (this.dateFmt) html += 'ztype="date" zmode="' + this.dateFmt + '" ';
            if (this.now) html += 'znow="' + this.now + '" ';
            if (this.verify) html += 'verify="' + this.getHeader() + '|' + this.verify + '"';
            html += '/>';
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
    }

    function TjEleSelect(colModel, tjGridId, type) {
        this.items = eval(colModel.items);
        this.verify = undefined || colModel.verify;
        this.relatedId = colModel.related ? 'grid-' + (type ? type : 'input') + '-ele-' + colModel.related + '-' + tjGridId : undefined;
        this.relateId = colModel.relate ? 'grid-' + (type ? type : 'input') + '-ele-' + colModel.relate + '-' + tjGridId : undefined;
        this.relateUrl = undefined || colModel.relateUrl;
        this.getElementHtml = function () {
            var html = '';
            if (this.verify) {
                html += '<select id="' + this.getId() + '" verify="' + this.getHeader() + '|' + this.verify + '" '
            } else {
                html = '<select id="' + this.getId() + '" ';
            }
            if (this.isSubmitted()) {
                html += 'name="' + this.getSelectDataType() + '">';
            } else {
                html += '>';
            }
            html += '<option value="">请选择</option>';
            for (var i in this.items) {
                html += '<option value="' + (this.items[i]).value + '">' + (this.items[i]).name + '</option>';
            }
            html += '</select>'
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
        this.setValue = function (value) {
            if (this.relatedId) $('[id="' + this.relatedId + '"]').blur();
            $('[id="' + this.getId() + '"]').find('option').each(function () {
                if ($(this).html() == value) {
                    $(this).attr('selected', 'selected');
                }
            });
        };
        this.getSelectDataType = function () {
            var index = this.getName().indexOf('.');
            if (index == -1) {//自身属性的情况
                return this.getName();
            } else {//关联属性的情况
                var name = this.getName().substring(0, index);
                if (this.getName().substring(index + 1) == 'codeDesc') {
                    return name + '.paraCode';
                } else {
                    return name + '.id';
                }
            }
        };
        this.handleRelateEvent = function () {
            var $this = this;
            $('[id="' + this.getId() + '"]').blur(function (event) {
                $this.triggerRalateAjax();
            });
        };
    }

    function TjEleCheckbox(colModel, tjGridId, type) {
        this.items = eval(colModel.items);
        this.getElementHtml = function () {
            var html = '<div style="width:200px" id="' + this.getId() + '">';
            for (var i in this.items) {
                html += '<input type="checkbox" ';
                if (this.isSubmitted() && type != 'multi') {
                    html += ' name="' + this.getName() + '" ';
                }
                html += ' value="' + (this.items[i]).value + '" /><span>' + (this.items[i]).name + '</span><br/>';
            }
            html += '</div>';
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
        this.clear = function () {
            $('div[id="' + this.getId() + '"] input[type="checkbox"]').attr('checked', false);
        };
        this.setValue = function (value) {
            $('[id="' + this.getId() + '"] input[type="checkbox"]').each(function () {
                if ($(this).next().html() == value) {
                    $(this).attr('checked', 'checked');
                }
            });
        }
    }

    function TjEleTextarea(colModel, tjGridId, type) {
        this.verify = undefined || colModel.verify;
        this.getElementHtml = function () {
            var html = '<textarea cols="27" rows="4" id="' + this.getId() + '"';
            if (this.isSubmitted()) html += ' name="' + this.getName() + '" ';
            if (this.verify)  html += 'verify="' + this.getHeader() + '|' + this.verify + '"';
            html += ' ></textarea>';
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
    }

    function TjEleAuto(colModel, tjGridId, type) {
        this.verify = '' || colModel.verify;
        this.url = '' || colModel.url;
        this.relatedId = colModel.related ? 'grid-' + (type ? type : 'input') + '-ele-' + colModel.related + '-' + tjGridId : undefined;
        this.relateId = colModel.relate ? 'grid-' + (type ? type : 'input') + '-ele-' + colModel.relate + '-' + tjGridId : undefined;
        this.relateUrl = undefined || colModel.relateUrl;
        this.getElementHtml = function () {
            var html = '<input id="' + this.getId() + '" style="float:left;" ztype="auto" ';
            if (this.isSubmitted()) html += ' name="' + this.getName() + '" ';
            if (this.verify) html += ' verify="' + this.getHeader() + '|' + this.verify + '"';
            if (this.url) html += ' url="' + this.url + '"';
            html += '/>';
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
        this.setValue = function (value) {
            $('*[id="' + this.getId() + '"]').data('editRelatedVal', value);
            if (this.relatedId) $('[id="' + this.relatedId + '"]').blur();
            $('[id="' + this.getId() + '"]').val(value);

        };
        this.handleRelateEvent = function () {
            var $this = this;
            $('[id="' + this.getId() + '"]').blur(function (event) {
                if (!($(document.activeElement).hasClass('ac_results')) && $(document.activeElement).val() != $(event.currentTarget).data('editRelatedVal')) {
                    $this.triggerRalateAjax();
                    $(event.currentTarget).data('editRelatedVal', $(document.activeElement).val());
                }
            });
        };
        this.clear = function () {
            $('[id="' + this.getId() + '"]').val('').removeData('editRelatedVal');
        }
    }

    function TjEleDate(colModel, tjGridId, type) {
        this.verify = undefined || colModel.verify;
        this.mode = colModel.mode || 'date';
        this.getElementHtml = function () {
            var html = '<input id="' + this.getId() + '" ztype="date" mode="' + this.mode + '" ';
            if (this.isSubmitted()) html += ' name="' + this.getName() + '" ';
            if (this.verify) html += ' verify="' + this.getHeader() + '|' + this.verify + '"';
            html += '/>';
            return html;
        };
        TjElement.call(this, colModel, tjGridId, type);
    }

})(jQuery);
