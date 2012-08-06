package com.taiji.frame.service.baseinfo;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.taiji.frame.model.baseinfo.Person;
import com.taiji.frame.service.util.CrudService;

@Service
public class PersonService extends CrudService<Person> {

	@Transactional(propagation = Propagation.REQUIRED, readOnly = true)
	public Person get(String loginName) {
		List<Person> people = this.dao.findBy("loginName", loginName);
		if (people != null && people.size() != 0) {
			if (people.size() > 1) {
				throw new RuntimeException("不应该有登录名相同的用户!");
			} else {
				return people.get(0);
			}
		}
		return null;
	}
}
