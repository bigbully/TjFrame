(function ($) {

    $(document).ready(function () {
        $.init_style();
    });

    $.init_style = function () {
        var $this = $(document.body);
        init_style_impl($this);
    };

    $.fn.init_style = function () {
        return this.each(function () {
            var $this = $(this);
            init_style_impl($this);
        });
    };

    function TjButton(target) {
        this.doAction = function () {
            $(target).button();
        }
    }

    function TjPopUp(target) {
        var obj = this;
        this.mode = $(target).attr('zmode') || 'ajax';
        this.title = $(target).attr('title') || '';
        this.url = $(target).attr('url');
        this.width = $(target).attr('zwidth') || tjStyleInit.tjPopUp.width;
        this.height = $(target).attr('zheight') || 'auto';
        this.postData = $(target).data('postData') || undefined;
        this.planDialog = function (width, height, title) {
            $('#dialogDiv').empty();
            $('#dialogDiv').dialog('option', 'width', width);
            $('#dialogDiv').dialog('option', 'height', height);
            $('#dialogDiv').dialog('option', 'title', title);
        };
        this.doAction = function () {
            $(target).click(function () {
                obj.planDialog(obj.width, obj.height, obj.title);
                if (obj.mode == 'iframe') {//如果是iframe的情况
                    $('#dialogDiv').html('<iframe id="iframe1" name="iframe1"  height="auto" width="auto" src="' + obj.url + '"></iframe>');
                } else {//如果是ajax的形式
                    $(target).data('postData') ? $('#dialogDiv').load(obj.url, $(target).data('postData')) : $('#dialogDiv').load(obj.url);
                }
                $('#dialogDiv').dialog('open');
            });
        };
        this.initDialogDiv = function () {
            if (!$('#dialogDiv').length) {
                $('body').append('<div style="display:none;" id="dialogDiv"></div>');
                //初始化弹出DIV
                $('#dialogDiv').dialog({
                    resizable:false,
                    autoOpen:false,
                    modal:true,
                    close:function (event, ui) {
                        // 关闭验证提示框
                        $('#dialogDiv').removeTip();
                        // 取消高亮显示
                        $('*[id^=gbox_]').find('tr[aria-selected="true"]').each(function () {
                            $(this).trigger('click');
                        });
                    }
                });
            }
        };
        this.initDialogDiv();
    }

    function TjSelectbox(target) {
        this.doAction = function () {
            var name = $(target).attr('name');
            $(target).addClass('selectBox');
            $(target).find('> ul').addClass('selectBoxList');
            if ($(target).find('> ul:first').css('height') == 'auto') {
                $(target).find('> ul').css('height', '150px');
            }
            $(target).selectBoxDiv();
        }
    }

    function TjDate(target) {
        var obj = this;
        this.modeMap = {
            time:'HH:mm:ss',
            timeHMC:'HH小时mm分钟',
            timeHM:'HH:mm',
            timeHL:'HH:mm',
            date:'yyyy-MM-dd',
            dateYM:'yyyy年MM月',
            datetime:'yyyy-MM-dd HH:mm:ss',
            dateYm:'yyyy年MM月',
            dateY:'yyyy'
        };
        this.getFormat = function (mode) {
            return obj.modeMap[mode].replace('yyyy', '%y').replace('mm', '%m').replace('dd', '%d').replace('HH', '%H').replace('mm', '%m').replace('ss', '%s');
        };
        this.doAction = function () {
            var modeTemp = $(target).attr('mode') || 'date';
            var mode = modeTemp;
            var datePara = {};
            if (modeTemp.indexOf('start') != -1) {
                mode = modeTemp.substring(5);
                var thisEndDate = $(target).parents('table:first').find('[mode="end' + mode + '"]:first');
                thisEndDate ? datePara.maxDate = '#F{$dp.$D(\'' + thisEndDate.attr('id') + '\')}' : null;
            }
            if (modeTemp.indexOf('end') != -1) {
                mode = modeTemp.substring(3);
                var thisStartDate = $(target).parents('table:first').find('[mode="start' + mode + '"]:first');
                thisStartDate ? datePara.minDate = '#F{$dp.$D(\'' + thisStartDate.attr('id') + '\')}' : null;
            }
            datePara.dateFmt = obj.modeMap[mode];
            if ($(target).attr('znow')) {
                $(target).attr('znow').indexOf('start') != -1 ? datePara.minDate = obj.getFormat(obj.modeMap[mode]) : null;
                $(target).attr('znow').indexOf('end') != -1 ? datePara.maxDate = obj.getFormat(obj.modeMap[mode]) : null;
            }
            $(target).focus(function () {
                WdatePicker(datePara);
            });
        }
    }

    function TjForm(target) {
        var obj = this;
        this.defaultValidateForm = function (data, theForm) {
            return theForm.data('tjForm').checkSubmit();// 这个checkSubmit方法在jquery.tj.validate.js扩展中
        };
        this.defaultOnSuccess = function (data, theForm) {
            data['result'] ? tjAlert("操作成功！") : tjAlert("操作失败！");
        };
        this.doAction = function () {
            $(target).form();// 为form统一创建验证
            $(target).ajaxForm({
                type:"post",
                dataType:'json',
                beforeSubmit:function (data) {
                    return ('validateForm' in window) ? validateForm(data, $(target)) : obj.defaultValidateForm(data, $(target));
                },
                success:function (data) {
                    ('onSuccess' in window) ? onSuccess(data) : obj.defaultOnSuccess(data, $(target));
                }
            });
        };
    }

    function TjAuto(target) {
        this.id = $(target).attr('id');
        this.url = $(target).attr('url') || tjStyleInit.contentPath + '/baseinfo/person!autocompleteAjax.action';//默认为查询人员，单选
        this.isMulti = $(target).attr('mode') == 'multi';// 获得是否允许多个自动完成
        this.defaultAutoCallback = function (event) {//默认的自动回调，为什么要从标签中重新取属性，因为回调时当前TjAuto对象已经销毁
            var array = $(event.target).val().split(',');// 数组
            var data = {};
            var desiredArr = new Array();
            for (var i = 0; i < array.length; i++) {//通过js对象属性没有重复值来去除自动完成中的重复
                data[array[i]] = array[i];
            }
            for (var pro in data) {
                desiredArr.push(data[pro]);
            }
            $(event.target).val(desiredArr.join(','));
        };
        this.autoCallback = $(target).attr('zcallback') ? new Function($(target).attr('zcallback') + "();") : this.defaultAutoCallback;
        this.doAction = function () {
            $(target).autocomplete(this.url, {
                multiple:this.isMulti, // 是否允许填入超过一个自动完成的值
                mustMatch:true, // results由后台决定
                matchContains:true, // 支持部分匹配的缓存
                scrollHeight:220,
                delay:500, // 支持的延迟时间（按键激活之后的延迟时间）
                // matchCase:true,//对大小写是否敏感，仅仅在使用缓存的时候比较重要
                selectFirst:true,
                extraParams:{// 传递给后台的额外参数
                    autoData:function () {
                        var funName = $(target).attr('zfun');
                        return funName ? eval(funName + '()') : null;
                    }
                },
                autoFill:false, // 自动填充
                multipleSeparator:',', // 当使用多个选项的时候，在两个值之间用“，”进行分割
                cacheLength:20,
                scroll:true,
                scrollHeight:180,
                parse:function (data) {
                    return $.map(eval(data), function (item) {
                        return {data:item, value:item.name, result:item.name};
                    });
                },
                formatItem:function (item) {
                    return item.name;
                },
                formatResult:function (item) {
                    return item.name;
                }
            }).result(this.autoCallback);
        }
    }

    function TjCheckbox(target) {
        this.doAction = function () {
            $(target).checkbox();
        };
    }

    window.init_style_impl = function ($this) {
        $.each($this.find('*[ztype]').not($('[zinit]')), function (i, item) {
            switch ($(item).attr('ztype')) {
                case 'button':
                {
                    new TjButton($(this)).doAction();
                    break;
                }
                case 'popUp':
                {
                    new TjPopUp($(this)).doAction();
                    break;
                }
                case 'selectbox':
                {
                    new TjSelectbox($(this)).doAction();
                    break;
                }
                case 'date':
                {
                    new TjDate($(this)).doAction();
                    break;
                }
                case 'form':
                {
                    new TjForm($(this)).doAction();
                    break;
                }
                case 'auto':
                {
                    new TjAuto($(this)).doAction();
                    break;
                }
                case 'checkbox':
                {
                    new TjCheckbox($(this)).doAction();
                    break;
                }
            }
            $(item).attr('zinit', true);
        });
    };

    window.tjAlert = function (str) {
        if (!$('#tjAlert').length) {
            $('body').append('<div id="tjAlert" style="text-align:center;word-wrap: break-word; word-break: normal;">' + str + '</div>');
            $('#tjAlert').dialog({
                resizable:false,
                autoOpen:false,
                width:tjStyleInit.tjAlert.width,
                modal:true,
                buttons:{
                    关闭:function () {
                        $('#tjAlert').dialog('close');
                    }
                }
            });
        } else {
            $('#tjAlert').html(str);
        }
        $('#tjAlert').dialog('open');
    };

    window.tjConfirm = function (str, callback) {
        if (!$('#tjConfirm').length) {
            $('body').append('<div id="tjConfirm" style="text-align:center;word-wrap: break-word; word-break: normal;">' + str + '</div>');
            $('#tjConfirm').dialog({
                resizable:false,
                autoOpen:false,
                width:tjStyleInit.tjConfirm.width,
                modal:true,
                buttons:{
                    确定:function () {
                        $(this).dialog('close');
                        callback(true);
                    },
                    取消:function () {
                        $(this).dialog('close');
                        callback(false);
                    }
                }
            });
        } else {
            $('#tjConfirm').html(str);
        }
        $('#tjConfirm').dialog('open');
        var confirmCallback = callback;
    };

    //扩展json,js转换
    $.type = function (o) {
        var _toS = Object.prototype.toString;
        var _types = {
            'undefined':'undefined',
            'number':'number',
            'boolean':'boolean',
            'string':'string',
            '[object Function]':'function',
            '[object RegExp]':'regexp',
            '[object Array]':'array',
            '[object Date]':'date',
            '[object Error]':'error'
        };
        return _types[typeof o] || _types[_toS.call(o)]
            || (o ? 'object' : 'null');
    };

    var $specialChars = {
        '\b':'\\b',
        '\t':'\\t',
        '\n':'\\n',
        '\f':'\\f',
        '\r':'\\r',
        '"':'\\"',
        '\\':'\\\\'
    };

    var $replaceChars = function (chr) {
        return $specialChars[chr] || '\\u00'
            + Math.floor(chr.charCodeAt() / 16).toString(16)
            + (chr.charCodeAt() % 16).toString(16);
    };

    $.toJSON = function (o) {
        var s = [];
        switch ($.type(o)) {
            case 'undefined':
                return 'undefined';
                break;
            case 'null':
                return 'null';
                break;
            case 'number':
            case 'boolean':
            case 'date':
            case 'function':
                return o.toString();
                break;
            case 'string':
                return '"' + o.replace(/[\x00-\x1f\\"]/g, $replaceChars) + '"';
                break;
            case 'array':
                for (var i = 0, l = o.length; i < l; i++) {
                    s.push($.toJSON(o[i]));
                }
                return '[' + s.join(',') + ']';
                break;
            case 'error':
            case 'object':
                for (var p in o) {
                    s.push(p + ':' + $.toJSON(o[p]));
                }
                return '{' + s.join(',') + '}';
                break;
            default:
                return '';
                break;
        }
    };

    $.evalJSON = function (s) {
        if ($.type(s) != 'string' || !s.length)
            return null;
        return eval('(' + s + ')');
    };

})(jQuery);


