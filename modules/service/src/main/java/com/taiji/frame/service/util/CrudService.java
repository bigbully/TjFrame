package com.taiji.frame.service.util;

import com.taiji.frame.common.util.ReflectionUtils;
import com.taiji.frame.util.BaseDAO;
import java.util.List;

import javax.annotation.Resource;

import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

public class CrudService<T> {

	protected Class<T> entityClass;

	protected BaseDAO<T> dao;

	// 子类初始化时获取泛型类型，用户DAO辨别当前操作对象和表
	public CrudService() {
		entityClass = ReflectionUtils.getSuperClassGenricType(getClass());
	}

	// 根据名称，模糊查询
	public List<T> getByNameLike(String nameLike) {
		return dao.getByNameLike(nameLike);
	}

	// 根据名称，精确查询
	@SuppressWarnings("unchecked")
	public T getByName(String name) {
		return (T) dao.getByName(name);
	}

	// 公共方法
	@Transactional(propagation = Propagation.REQUIRED)
	public void save(T t) {
		dao.save(t);
	}

	@Transactional(propagation = Propagation.REQUIRED)
	public void delete(Long id) {
		dao.delete(id);
	}

	public T get(Long id) {
		return dao.get(id);
	}

	/**
	  * Description: 根据某个字段进行查找，必须唯一
	  * @author       zml
	  * @param propertyName 表中的某个字段
	  * @param value 该字段的值
	  * @return
	  * return_type  T
	  * @exception   
	  * @throws	 
	  * @lastModify  zml 2012年2月9日 描述修改内容
	  */
	public T get(String propertyName, Object value) {
		return dao.findUniqueBy(propertyName, value);
	}

	public List<T> getAll() {
		return dao.getAll();
	}

	/**
	 * findAll带排序
	 * 
	 * @param orderByProperty
	 *            按照哪一个字段排序，该参数应写对象中的属性名，而不是数据表的字段名
	 * @param isAsc
	 *            是否执行asc排序方式
	 * @return
	 */
	public List<T> getAll(String orderByProperty, boolean isAsc) {
		return dao.getAll(orderByProperty, isAsc);
	}

	// 因为要在spring注入后初始化baseDAO的entityClass属性，所以只能用set注入，如果用
	// 属性注入，因为注入是在调用构造函数之后，所以无法使用构造函数实现set entityClass
	// 因为BaseDAO的@Scope("prototype")配置，而DeptService类似这样的service类是单例
	// 模式，所以保证了所有的service具体类都只在服务器启动时初始化一次，并且各自都是注入一个
	// 新的只属于自己的baseDAO，其类型就是自己的泛型类型，不会引起线程问题
	@Resource(name = "baseDAO")
	public void setDao(BaseDAO<T> dao) {
		this.dao = dao;
		dao.setEntityClass(entityClass);
	}
}
