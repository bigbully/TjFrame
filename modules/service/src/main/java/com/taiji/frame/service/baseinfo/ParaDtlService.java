package com.taiji.frame.service.baseinfo;

import com.taiji.frame.model.para.ParaDtl;
import com.taiji.frame.service.util.CrudService;
import com.taiji.frame.model.para.ParaDtl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParaDtlService extends CrudService<ParaDtl> {

	@SuppressWarnings("unchecked")
	public List<ParaDtl> get(Class entityClass) {
		String hql = "from " + entityClass.getSimpleName() + " order by sortby";
		return this.dao.find(hql);
	}

	//根据类型和paraCode查找某一个参数
	@SuppressWarnings("unchecked")
	public ParaDtl getByCode(Class entityClass, String paraCode) {
		String hql = "from " + entityClass.getSimpleName() + " where paraCode =? ";
		return this.dao.findUnique(hql, paraCode);
	}

	//根据类型和paraCode查找某一个参数
	@SuppressWarnings("unchecked")
	public ParaDtl getByDesc(Class entityClass, String codeDesc) {
		String hql = "from " + entityClass.getSimpleName() + " where codeDesc =? ";
		return this.dao.findUnique(hql, codeDesc);
	}
}
