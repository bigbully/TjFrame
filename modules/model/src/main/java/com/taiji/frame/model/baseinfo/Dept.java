package com.taiji.frame.model.baseinfo;

import com.taiji.frame.model.para.DeptType;
import com.taiji.frame.model.para.TransType;
import com.taiji.frame.model.util.Jsonable;
import com.taiji.frame.model.util.AutoCompleteable;
import com.taiji.frame.model.util.IdEntity;
import net.sf.json.JSONObject;

import javax.persistence.*;
import java.util.List;

//部门
@Entity
@Table(name = "TB_BASE_DEPT")
public class Dept extends IdEntity implements Jsonable, AutoCompleteable {
	private String code;
	private String name;
//	private DeptType deptType;//部门类型
    private List<Group> groups;//下属班组
	private List<Person> persons;//下属人员
    private List<TransType> transTypes; //部门对应的传输方式

	//grid专用json
	@Transient
	@Override
	public String getJsonObject() {
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("id", this.getId());
		jsonObject.put("name", this.getName());
		jsonObject.put("code", this.getCode());
//		jsonObject.put("deptType.codeDesc", this.getDeptType().getCodeDesc());
		String transTypesStr = "";
		for (TransType transType : this.getTransTypes()) {
			transTypesStr += transType.getCodeDesc() + ",";
		}
		if (!transTypesStr.equals("")) {
			transTypesStr = transTypesStr.substring(0, transTypesStr.length() - 1);
		}
		jsonObject.put("transTypes.codeDesc", transTypesStr);
		return jsonObject.toString();
	}

    @Transient
    @Override
    public String getAutoCompleteJson() {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", this.getId());
        jsonObject.put("name", this.getName());
        return jsonObject.toString();
    }

	public Dept() {}

	public Dept(long id) {
		this.id = id;
	}

	@OneToMany(cascade = CascadeType.PERSIST, mappedBy = "dept", fetch = FetchType.LAZY, targetEntity = Person.class)
	public List<Person> getPersons() {
		return persons;
	}

	public void setPersons(List<Person> persons) {
		this.persons = persons;
	}

	@Column(name = "DEPT_CODE", nullable = false, unique = true, length = 4)
	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	@Column(name = "DEPT_NAME", length = 100, nullable = false)
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "dept", fetch = FetchType.LAZY, targetEntity = Group.class)
	public List<Group> getGroups() {
		return groups;
	}

	public void setGroups(List<Group> groups) {
		this.groups = groups;
	}

//	@ManyToOne()
//	@JoinColumn(name = "DEPT_TYPE", nullable = false)
//	public DeptType getDeptType() {
//		return deptType;
//	}
//
//	public void setDeptType(DeptType deptType) {
//		this.deptType = deptType;
//	}

    @ManyToMany(cascade = { CascadeType.PERSIST }, fetch = FetchType.LAZY)
    @JoinTable(name = "TB_ETMS_BASE_DP_TRTP", joinColumns = @JoinColumn(name = "DP_ID"), inverseJoinColumns = @JoinColumn(name = "TRANS_TYPE"))
    public List<TransType> getTransTypes() {
        return transTypes;
    }

    public void setTransTypes(List<TransType> transTypes) {
        this.transTypes = transTypes;
    }

}
