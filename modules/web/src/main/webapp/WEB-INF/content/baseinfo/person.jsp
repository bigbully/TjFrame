<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <script type="text/javascript">
        $(document).ready(function(){
            var colModel=[{name:'id',header:'id',hidden:true,editable:false},
                {name:'name',header:'姓名',verify:'NotNull&&Length<20&&NotRepeat={val:\'baseinfo.person.name\',delay:true}'},
                {name:'dept.name',header:'部门',verify:'NotNull',relate:'group.name',inputType:'select',items: ${deptList},relateUrl:'${request.contextPath}/baseinfo/dept!getGroupsAjax.action'},
                {name:'group.name',header:"班组名称",editable:true,inputType:'select',related:'dept.name'},
                {name:'code',header:'编码', verify:'NotNull&&Length<20&&NotRepeat={val:\'baseinfo.person.code\',delay:true}'},
                {name:'sex',header:'性别', inputType:'select',items:${sexList}},
                {name:'mobile',header:'手机号'},
                {name:'updDate',header:'更新日期', inputType:'date',verify:'NotNull'},
                {name:'birthday',header:'生日', inputType:'date'}
            ];
            $('#person-show').grid({name:'人员信息',colModel:colModel});
        });
    </script>
</head>
<body>
<div id="person-show"></div>
</body>
</html>