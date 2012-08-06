<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <script language="JavaScript" type="text/javascript">
        $(document).ready(function(){
            var colModel=[{name:'id',header:'id',sortable:true,hidden:true,editable:false},
                {name:'code',header:'节目代码',sortable:true,verify:'NotNull&&Length<20&&NotRepeat={val:\'baseinfo.program.code\',delay:true}'},
                {name:'name',header:'节目名称',sortable:true,verify:'NotNull&&Length<64&&NotRepeat={val:\'baseinfo.program.name\',delay:true}'},
                {name:'updDate',header:'更新时间',inputType:'date',mode:'date',verify:'NotNull'},
                {name:'programType.codeDesc',header:'节目类型',sortable:true,inputType:'select', items: '${programTypeList}',verify:'NotNull'}]

            $('#program-show').grid({name:'节目',colModel:colModel});
        });
    </script>
</head>
<body>
<div id="program-show"></div>
</body>
</html>
