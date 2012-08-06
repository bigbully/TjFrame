package com.taiji.frame.action.baseinfo;

import com.taiji.frame.action.util.GridAction;
import com.taiji.frame.model.baseinfo.Person;
import com.taiji.frame.service.baseinfo.DeptService;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

public class PersonAction extends GridAction<Person> {

	private static final long serialVersionUID = -4942965671834213264L;

    private String sexList;
    private String deptList;

    public String show() throws Exception {
        startDynamicColumns();
        JSONArray array = new JSONArray();
        JSONObject obj1 = new JSONObject();
        obj1.put("name", "男");
        obj1.put("value", "1");
        array.add(obj1);
        JSONObject obj2 = new JSONObject();
        obj2.put("name", "女");
        obj2.put("value", "0");
        array.add(obj2);
        sexList = array.toString();
        deptList = this.assemblyJsonArray(deptService.getAll(), "name");
        return SUCCESS;
    }

    public void preSave(Person model){
        if (model.getGroup() != null && model.getGroup().getId() == null){
            model.setGroup(null);
        }
        if (model.getSex() != null && model.getSex().equals("")){
            model.setSex(null);
        }
    }

    protected void beforeSave(Person model) {
        model.setDept(null);
        model.setGroup(null);
    }

    protected void beforeUpdate(Person model) {
        model.setDept(null);
        model.setGroup(null);
    }

    public String input(){
        return "input";
    }

    @Autowired
    private DeptService deptService;

    public String getSexList() {
        return sexList;
    }

    public void setSexList(String sexList) {
        this.sexList = sexList;
    }

    public String getDeptList() {
        return deptList;
    }

    public void setDeptList(String deptList) {
        this.deptList = deptList;
    }
}
