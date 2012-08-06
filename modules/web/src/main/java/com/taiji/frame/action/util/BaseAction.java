package com.taiji.frame.action.util;

import com.opensymphony.xwork2.Action;
import com.taiji.frame.common.util.DateUtil;
import com.taiji.frame.model.baseinfo.Person;
import com.taiji.frame.model.baseinfo.Person;
import com.taiji.frame.service.baseinfo.PersonService;
import com.taiji.frame.service.util.UtilService;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.Serializable;
import java.util.Date;

@Results( { @Result(name = "easy", type = "grid", params = { "type", "easy", "exposedValue", "json" }) })
public abstract class BaseAction implements Action, Serializable {

	private static final long serialVersionUID = 7026530169731783701L;

	public static final String EASY = "easy";

	protected String json;

    public Person getCurUser() {
        Person person = personService.get("admin");
        return person;
    }

	public Date getCurDate() {
		return utilService.getSysTime();
	}

	public String getCurDateStr() {
		return DateUtil.dateToString(getCurDate(), DateUtil.FORMAT_DAY_CN_HM);
	}

	//空的execute方法，接口需要
	@Override
	public String execute() throws Exception {
		return SUCCESS;
	}

	private UtilService utilService;

	@Autowired
	private PersonService personService;

	@Autowired
	public void setUtilService(UtilService utilService) {
		this.utilService = utilService;
	}

	public String getJson() {
		return json;
	}

}
