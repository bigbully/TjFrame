package com.taiji.frame.action.baseinfo;

import com.taiji.frame.action.util.GridAction;
import com.taiji.frame.model.baseinfo.Dept;
import com.taiji.frame.model.baseinfo.Group;
import com.taiji.frame.model.baseinfo.Person;
import com.taiji.frame.service.baseinfo.DeptService;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

public class DeptAction extends GridAction<Dept> {

	private static final long serialVersionUID = -4942965671834213264L;
    private String name;

    //部门联动班组的ajax
    public String getGroupsAjax() throws Exception {
        List<Group> groups = this.deptService.get(id).getGroups();
        JSONObject jsonObject = new JSONObject();
        if (groups.size() != 0) {
            jsonObject.put("result", true);
            jsonObject.put("data", json = this.assemblyJsonArray(groups, "name"));
            json = jsonObject.toString();
        } else {
            jsonObject.put("result", false);
            json = jsonObject.toString();
        }
        return EASY;
    }


    //部门联动班组的ajax
    public String getGroupsByNameAjax() throws Exception {
        List<Group> groups = this.deptService.get("name", name).getGroups();   //auto
        JSONObject jsonObject = new JSONObject();
        if (groups.size() != 0) {
            jsonObject.put("result", true);
            jsonObject.put("data", json = this.assemblyJsonArray(groups, "name"));
            json = jsonObject.toString();
        } else {
            jsonObject.put("result", false);
            json = jsonObject.toString();
        }
        return EASY;
    }
    @Autowired
    private DeptService deptService;

    public void setName(String name) {
        this.name = name;
    }
}
