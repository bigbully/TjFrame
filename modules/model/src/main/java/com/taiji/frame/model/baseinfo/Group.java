package com.taiji.frame.model.baseinfo;

import com.taiji.frame.model.util.Jsonable;
import com.taiji.frame.model.util.IdEntity;
import net.sf.json.JSONObject;

import javax.persistence.*;

//班组
@Entity
@Table(name = "TB_BASE_GROUP")
public class Group extends IdEntity implements Jsonable {

	private String name;//班组名称
	private Dept dept;//所属部门

	@Transient
	@Override
	public String getJsonObject() {
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("id", this.getId());
		jsonObject.put("dept.name", this.getDept().getName());
		jsonObject.put("name", this.getName());
		return jsonObject.toString();
	}

	public Group() {}

	public Group(long id) {
		this.id = id;
	}

	@ManyToOne()
	@JoinColumn(name = "DP_ID", nullable = false)
	public Dept getDept() {
		return dept;
	}

	public void setDept(Dept dept) {
		this.dept = dept;
	}

	@Column(name = "GROUP_NAME", length = 64, nullable = false)
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

}
