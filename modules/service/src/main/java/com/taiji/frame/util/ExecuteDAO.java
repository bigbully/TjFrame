/**
 * Copyright (c) 2005-2010 springside.org.cn
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * 
 * $Id: SimpleHibernateDao.java 1205 2010-09-09 15:12:17Z calvinxiu $
 */
package com.taiji.frame.util;

import com.taiji.frame.common.util.Carrier;
import com.taiji.frame.common.util.DateUtil;
import com.taiji.frame.common.util.ReflectionUtils;
import com.taiji.frame.service.util.UtilService;
import com.taiji.frame.model.util.IdEntity;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.hibernate.*;
import org.hibernate.criterion.CriteriaSpecification;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;
import org.hibernate.metadata.ClassMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import javax.persistence.Column;
import javax.persistence.JoinColumn;
import javax.persistence.Table;

@Repository
@SuppressWarnings("unchecked")
public class ExecuteDAO {

	protected Logger logger = Logger.getLogger(getClass());

	protected SessionFactory sessionFactory;

	public ExecuteDAO() {}

	/**
	 * 取得当前Session.
	 */
	public Session getSession() {
		return sessionFactory.getCurrentSession();
	}

	/**
	 * 保存新增或修改的对象.
	 */
	public void save(final Class entityClass, final Object entity) {
		Assert.notNull(entity, "entity不能为空");
		getSession().saveOrUpdate(entity);
		logger.debug("save entity: " + entityClass.getSimpleName());
	}

    //多选编辑
    public <X> void multiSave(final Class entityClass, JSONObject json) throws NoSuchFieldException, NoSuchMethodException {
        StringBuilder sb = new StringBuilder("update ");
        //查找表名
        String schemaName =((Table)entityClass.getAnnotation(Table.class)).name();
        sb.append(schemaName).append(" ");
        //处理列名
        JSONArray array = json.getJSONArray("multiArray");
        for(int i = 0;i < array.size();i++){
            JSONObject eachJson = (JSONObject)array.get(i);
            if (i == 0) sb.append("set ");
            String property = eachJson.getString("property");
            if (property.indexOf(".") != -1){
                String priProperty = property.substring(0,property.indexOf("."));
                String subProperty = property.substring(property.indexOf(".") + 1);
                Method method =  entityClass.getMethod("get" + priProperty.substring(0,1).toUpperCase() + priProperty.substring(1));
                sb.append(method.getAnnotation(JoinColumn.class).name());
                if (subProperty.equalsIgnoreCase("id") || subProperty.equalsIgnoreCase("paraCode")) {//如果关联属性传回的是ID
                    sb.append("='").append(eachJson.get("value")).append("'");
                }else if (subProperty.equalsIgnoreCase("name")){
                    sb.append("='").append(((IdEntity)(this.getByName(method.getGenericReturnType().getClass(), eachJson.get("value").toString()))).getId()).append("'");
                }
            }else {
                sb.append(property).append("='").append(eachJson.get("value")).append("'");
            }
            if (i != array.size() - 1) sb.append(",");
        }
        //查找ID对应的字段名
        Field field = ReflectionUtils.getAccessibleField(entityClass, "id");
        String idName = field.getAnnotation(Column.class) == null?"id": field.getAnnotation(Column.class).name();
        sb.append(" where ").append(idName).append(" in (").append(json.getString("selectedIds")).append(")");
        batchSqlExecute(sb.toString(),null);
    }

	/**
	 * 删除对象.
	 * 
	 * @param entity
	 *            对象必须是session中的对象或含id属性的transient对象.
	 */
	public void delete(final Class entityClass, final Object entity) {
		Assert.notNull(entity, "entity不能为空");
		getSession().delete(entity);
		logger.debug("delete entity: " + entityClass.getSimpleName());
	}

	/**
	 * 按id删除对象.
	 */
	public void delete(final Class entityClass, final Long id) {
		Assert.notNull(id, "id不能为空");
		delete(entityClass, get(entityClass, id));
		logger.debug("delete entity " + entityClass.getSimpleName() + "," + "id is " + id);
	}

	/**
	 * 按id获取对象.
	 */
	@Transactional(propagation = Propagation.REQUIRED, readOnly = true)
	public <X> X get(final Class entityClass, final Long id) {
		Assert.notNull(id, "id不能为空");
		return (X) getSession().get(entityClass, id);
	}

	/**
	 * 按id获取对象(查库取出).
	 */
	public <X> X getWithStatelessSession(final Class entityClass, final Long id) {
		Assert.notNull(id, "id不能为空");
		String hql = "from " + entityClass.getName() + " where id =:id";
		Query query = this.getSessionFactory().openStatelessSession().createQuery(hql);
		query.setLong("id", id);
		List<X> list = query.list();
		if (list == null || list.size() == 0) {
			return null;
		} else {
			return list.get(0);
		}
	}

	/**
	 * 按id列表获取对象列表.
	 */
	public List get(final Class entityClass, final Collection<Long> ids) {
		return find(entityClass, Restrictions.in(getIdName(entityClass), ids));
	}

	/**
	 * 获取全部对象.
	 */
	public List getAll(final Class entityClass) {
		String hql = "from " + entityClass.getSimpleName();
		Query query = this.getSession().createQuery(hql);
		return query.list();
	}

	/**
	 * 获取全部对象, 支持按属性行序.
	 */
	public List getAll(final Class entityClass, String orderByProperty, boolean isAsc) {
		Criteria c = createCriteria(entityClass);
		if (isAsc) {
			c.addOrder(Order.asc(orderByProperty));
		} else {
			c.addOrder(Order.desc(orderByProperty));
		}
		return c.list();
	}

	/**
	 * 按属性查找对象列表, 匹配方式为相等.
	 */
	public List findBy(final Class entityClass, final String propertyName, final Object value) {
		Assert.hasText(propertyName, "propertyName不能为空");
		Criterion criterion = Restrictions.eq(propertyName, value);
		return find(entityClass, criterion);
	}

	/**
	 * 按属性查找唯一对象, 匹配方式为相等.
	 */
	public Object findUniqueBy(final Class entityClass, final String propertyName, final Object value) {
		Assert.hasText(propertyName, "propertyName不能为空");
		Criterion criterion = Restrictions.eq(propertyName, value);
		return createCriteria(entityClass, criterion).uniqueResult();
	}

	/**
	 * 按SQL查询唯一对象.
	 * 
	 * @param sql
	 *            数量可变的Sql.
	 */
	public Object findObjectUnique(String sql) {
		return this.getSession().createSQLQuery(sql).uniqueResult();
	}

	/**
	 * 按HQL查询对象列表.
	 * 
	 * @param values
	 *            数量可变的参数,按顺序绑定.
	 */
	public <X> List<X> find(final String hql, final Object... values) {
		return createQuery(hql, values).list();
	}

	/**
	 * 按HQL查询对象列表.
	 * 
	 * @param values
	 *            命名参数,按名称绑定.
	 */
	public <X> List<X> find(final String hql, final Map<String, ?> values) {
		return createQuery(hql, values).list();
	}

	/**
	 * 按HQL查询唯一对象.
	 * 
	 * @param values
	 *            数量可变的参数,按顺序绑定.
	 */
	public <X> X findUnique(final String hql, final Object... values) {
		return (X) createQuery(hql, values).uniqueResult();
	}

	/**
	 * 按HQL查询唯一对象.
	 * 
	 * @param values
	 *            命名参数,按名称绑定.
	 */
	public <X> X findUnique(final String hql, final Map<String, ?> values) {
		return (X) createQuery(hql, values).uniqueResult();
	}

	/**
	 * 执行HQL进行批量修改/删除操作.
	 * 
	 * @param values
	 *            数量可变的参数,按顺序绑定.
	 * @return 更新记录数.
	 */
	public int batchExecute(final String hql, final Object... values) {
		return createQuery(hql, values).executeUpdate();
	}

	/**
	 * 执行HQL进行批量修改/删除操作.
	 * 
	 * @param values
	 *            命名参数,按名称绑定.
	 * @return 更新记录数.
	 */
	public int batchExecute(final String hql, final Map<String, ?> values) {
		return createQuery(hql, values).executeUpdate();
	}

	/**
	 * 根据查询HQL与参数列表创建Query对象. 与find()函数可进行更加灵活的操作.
	 * 
	 * @param values
	 *            数量可变的参数,按顺序绑定.
	 */
	public Query createQuery(final String queryString, final Object... values) {
		Assert.hasText(queryString, "queryString不能为空");
		Query query = getSession().createQuery(queryString);
		if (values != null) {
			for (int i = 0; i < values.length; i++) {
				query.setParameter(i, values[i]);
			}
		}
		return query;
	}

	/**
	 * 根据查询HQL与参数列表创建Query对象. 与find()函数可进行更加灵活的操作.
	 * 
	 * @param values
	 *            命名参数,按名称绑定.
	 */
	public Query createQuery(final String queryString, final Map<String, ?> values) {
		Assert.hasText(queryString, "queryString不能为空");
		Query query = getSession().createQuery(queryString);
		if (values != null) {
			query.setProperties(values);
		}
		return query;
	}

    /**
     * 执行SQL进行批量修改/删除操作.
     *
     * @param values
     *            数量可变的参数,按顺序绑定.
     * @return 更新记录数.
     */
    public int batchSqlExecute(final String sql, final Map<String, ?> values) {
        return createSqlQuery(sql, values).executeUpdate();
    }

    //按sql查找
    public Query createSqlQuery(final String queryString, final Map<String, ?> values) {
        Assert.hasText(queryString, "queryString不能为空");
        SQLQuery query = getSession().createSQLQuery(queryString);
        if (values != null) {
            query.setProperties(values);
        }
        return query;
    }

	/**
	 * 按Criteria查询对象列表.
	 * 
	 * @param criterions
	 *            数量可变的Criterion.
	 */
	public List find(final Class entityClass, final Criterion... criterions) {
		return createCriteria(entityClass, criterions).list();
	}

	/**
	 * 按Criteria查询唯一对象.
	 * 
	 * @param criterions
	 *            数量可变的Criterion.
	 */
	public Object findUnique(final Class entityClass, final Criterion... criterions) {
		return createCriteria(entityClass, criterions).uniqueResult();
	}

	/**
	 * 根据Criterion条件创建Criteria. 与find()函数可进行更加灵活的操作.
	 * 
	 * @param criterions
	 *            数量可变的Criterion.
	 */
	public Criteria createCriteria(final Class entityClass, final Criterion... criterions) {
		Criteria criteria = getSession().createCriteria(entityClass);
		for (Criterion c : criterions) {
			criteria.add(c);
		}
		return criteria;
	}

	/**
	 * 初始化对象. 使用load()方法得到的仅是对象Proxy, 在传到View层前需要进行初始化. 如果传入entity,
	 * 则只初始化entity的直接属性,但不会初始化延迟加载的关联集合和属性. 如需初始化关联属性,需执行:
	 * Hibernate.initialize(user.getRoles())，初始化User的直接属性和关联集合.
	 * Hibernate.initialize
	 * (user.getDescription())，初始化User的直接属性和延迟加载的Description属性.
	 */
	public void initProxyObject(Object proxy) {
		Hibernate.initialize(proxy);
	}

	/**
	 * Flush当前Session.
	 */
	public void flush() {
		getSession().flush();
	}

	/**
	 * 为Query添加distinct transformer. 预加载关联对象的HQL会引起主对象重复, 需要进行distinct处理.
	 */
	public Query distinct(Query query) {
		query.setResultTransformer(CriteriaSpecification.DISTINCT_ROOT_ENTITY);
		return query;
	}

	/**
	 * 为Criteria添加distinct transformer. 预加载关联对象的HQL会引起主对象重复, 需要进行distinct处理.
	 */
	public Criteria distinct(Criteria criteria) {
		criteria.setResultTransformer(CriteriaSpecification.DISTINCT_ROOT_ENTITY);
		return criteria;
	}

	/**
	 * 取得对象的主键名.
	 */
	public String getIdName(final Class entityClass) {
		ClassMetadata meta = getSessionFactory().getClassMetadata(entityClass);
		return meta.getIdentifierPropertyName();
	}

	/**
	 * 判断对象的属性值在数据库内是否唯一.
	 * 
	 * 在修改对象的情景下,如果属性新修改的值(value)等于属性原来的值(orgValue)则不作比较.
	 */
	public boolean isPropertyUnique(final Class entityClass, final String propertyName, final Object newValue,
			final Object oldValue) {
		if (newValue == null || newValue.equals(oldValue)) {
			return true;
		}
		Object object = findUniqueBy(entityClass, propertyName, newValue);
		return (object == null);
	}

	//-- 分页查询函数 --//

	/**
	 * 分页获取全部对象.
	 */
	public void find(final Class entityClass, final Carrier carrier) {
		String hql = "from " + entityClass.getSimpleName();

		hql = setPageParameterToHqlPro(hql, carrier,entityClass);
		Query query = this.getSession().createQuery(hql);
		if (carrier.isAutoCount()) {
			long totalCount = countHqlResult(hql);
			carrier.setTotalSize(totalCount);
		}
		setPageParameterToQuery(query, carrier);

		List result = query.list();
		carrier.setResult(result);
	}

	public <X> List<X> getByNameLike(final Class entityClass, final String nameLike) {
		String hql = "from " + entityClass.getSimpleName() + " c where c.name like ?";
		return this.find(hql, "%" + nameLike + "%");
	}

	//根据名称，精确查询
	public <X> X getByName(final Class entityClass, final String name) {
		String hql = "from " + entityClass.getSimpleName() + " c where c.name = ?";
		return (X) this.findUnique(hql, name);
	}

	/**
	 * 一次性删除多个对象
	 */
	public void delete(final Class entityClass, final Carrier carrier) throws Exception {
		JSONArray array = JSONArray.fromObject(carrier.getDelIds());
		for (Object id : array) {
			delete(entityClass, Long.valueOf(id.toString()));
		}
	}

	/**
	 * 按HQL分页查询.
	 * 
	 * @param carrier 分页参数.
	 * @param hql hql语句.
	 * @param values 数量可变的查询参数,按顺序绑定.
	 * 
	 * @return 分页查询结果, 附带结果列表及所有查询输入参数.
	 */
	public Carrier find(final Carrier carrier, String hql, final Object... values) {
		Assert.notNull(carrier, "carrier不能为空");

		hql = setPageParameterToHql(hql, carrier);
		Query q = createQuery(hql, values);
		if (carrier.isAutoCount()) {
			long totalCount = countHqlResult(hql, values);
			carrier.setTotalSize(totalCount);
		}
		setPageParameterToQuery(q, carrier);

		List result = q.list();
		carrier.setResult(result);
		return carrier;
	}

	/**
	 * 按HQL分页查询.
	 * 
	 * @param carrier 分页参数. 注意不支持其中的orderBy参数.
	 * @param hql hql语句.
	 * @param values 命名参数,按名称绑定.
	 * 
	 * @return 分页查询结果, 附带结果列表及所有查询输入参数.
	 */
	public void find(final Carrier carrier, String hql, final Map<String, ?> values) {
		Assert.notNull(carrier, "carrier不能为空");
		try {
			hql = setPageParameterToHql(hql, carrier);
			Query q = createQuery(hql, values);
			if (carrier.isAutoCount()) {
				long totalCount = countHqlResult(hql, values);
				carrier.setTotalSize(totalCount);
			}
			setPageParameterToQuery(q, carrier);

			List result = q.list();
			carrier.setResult(result);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	/**
	 * 设置分页参数到Query对象,辅助函数.
	 */
	protected Query setPageParameterToQuery(final Query q, final Carrier carrier) {

		Assert.isTrue(carrier.getPageSize() > 0, "Page Size must larger than zero");

		//hibernate的firstResult的序号从0开始
		q.setFirstResult(carrier.getFirstResult());
		q.setMaxResults(carrier.getPageSize());
		return q;
	}

	/**
	 * 设置分页参数到hql字符串,辅助函数.
	 */
	private String setPageParameterToHql(String hql, final Carrier carrier) {
		String sidx = carrier.getSidx();
		String sord = carrier.getSord();
		String filters = carrier.getFilters();
        hql = handleFilter(hql, filters);
		if (sidx != null && !sidx.equals("")) {
			if (sidx.indexOf("_") == -1) {
				hql += " order by " + sidx;
			} else {
				hql += " order by " + sidx.replace("_", ".");
			}
			if (carrier.getSord() != null && !carrier.getSord().equals("")) {
				hql += " " + sord;
			} else {
				hql += " asc";
			}
		}
		return hql;
	}
    /**
	 * 设置分页参数到hql字符串,辅助函数.
	 */
	private String setPageParameterToHqlPro(String hql, final Carrier carrier, Class entityClass) {
		String sidx = carrier.getSidx();
		String sord = carrier.getSord();
		String filters = carrier.getFilters();
        hql = handleFilterPro(hql, filters, entityClass);
		if (sidx != null && !sidx.equals("")) {
			if (sidx.indexOf("_") == -1) {
				hql += " order by " + sidx;
			} else {
				hql += " order by " + sidx.replace("_", ".");
			}
			if (carrier.getSord() != null && !carrier.getSord().equals("")) {
				hql += " " + sord;
			} else {
				hql += " asc";
			}
		}
		return hql;
	}

    private String handleFilter(String hql, String filters) {
        if (filters != null){
            JSONArray array = JSONObject.fromObject(filters).getJSONArray("rules");
            if (array != null && array.size() != 0){
                if (hql.indexOf("where") != -1){
                    hql += " and ";
                }else {
                    hql += " where ";
                }
                for(int i = 0; i< array.size();i++){
                    JSONObject eachFilter = (JSONObject)array.get(0);
                    if (i == 0)
                        hql += " "+ eachFilter.getString("field") +" like '%" + eachFilter.getString("data")+"%'";
                    if (i != array.size() - 1){
                        hql += " and ";
                    }
                }
            }
        }
        return hql;
    }

    private String handleFilterPro(String hql, String filters, Class entityClass){
        if (filters != null){
            JSONArray array = JSONObject.fromObject(filters).getJSONArray("rules");
            if (array != null && array.size() != 0){
                if (hql.indexOf("where") != -1){
                    hql += " and ";
                }else {
                    hql += " where ";
                }
                for(int i = 0; i< array.size();i++){
                    JSONObject eachFilter = (JSONObject)array.get(i);
                    String field = eachFilter.getString("field");
                    if (field.toLowerCase().indexOf("date") != -1 || field.toLowerCase().indexOf("time") != -1){//如果有可能有日期类型的数据
                        try{
                            if (entityClass.getDeclaredField(field) != null && entityClass.getDeclaredField(field).getType() == Date.class){
                                Date curDate = utilService.getSysTime();
                                String dateType = eachFilter.getString("data");
                                if (dateType.equals("本月")){
                                    Date firstDayOfMonth = DateUtil.getFirstDayOfMonth(curDate);
                                    Date firstDayOfNextMonth = DateUtil.getFirstDayOfMonth(DateUtil.addMonth(curDate,1));
                                    hql += " " + field + ">='" + DateUtil.getDateStr(firstDayOfMonth) + "' and " + field + "<'" + DateUtil.getDateStr(firstDayOfNextMonth) + "'";
                                    if (i != array.size() - 1) {
                                        hql += " and ";
                                    }
                                }else if (dateType.equals("本年")){
                                    Date firstDayOfYear = DateUtil.getFirstDayOfYear(Integer.parseInt(DateUtil.dateToString(curDate, "yyyy")));
                                    Date firstDayOfNextYear = DateUtil.getFirstDayOfYear(Integer.parseInt(DateUtil.dateToString(DateUtil.addYear(curDate,1), "yyyy")));
                                    hql += " " + field + ">='" + DateUtil.getDateStr(firstDayOfYear) + "' and " + field + "<'" + DateUtil.getDateStr(firstDayOfNextYear) + "'";
                                    if (i != array.size() - 1) {
                                        hql += " and ";
                                    }
                                }else if (dateType.indexOf("至") != -1){
                                    String startDate = dateType.substring(0, dateType.indexOf("至")).trim();
                                    String endDate = dateType.substring(dateType.indexOf("至") + 1).trim();
                                    if (!startDate.equals("")){
                                        hql += " " + field + ">='" + startDate + "'";
                                        if (!endDate.equals("")) {
                                            hql += " and " + field + "<'" + DateUtil.getDateStr(DateUtil.addDay(DateUtil.createDate(endDate), 1)) + "'";
                                        }
                                    } else {
                                        hql += " " + field + "<'" + DateUtil.getDateStr(DateUtil.addDay(DateUtil.createDate(endDate), 1)) + "'";
                                    }
                                    if (i != array.size() - 1) {
                                        hql += " and ";
                                    }
                                }
                            }
                        } catch (Exception e){
                           e.printStackTrace();
                        }
                    } else {//如果是普通类型
                        hql += " "+ eachFilter.getString("field") +" like '%" + eachFilter.getString("data")+"%'";
                        if (i != array.size() - 1){
                            hql += " and ";
                        }
                    }
                }
            }
        }
        return hql;
    }

    /**
	 * 执行count查询获得本次Hql查询所能获得的对象总数.
	 * 
	 * 本函数只能自动处理简单的hql语句,复杂的hql查询请另行编写count语句查询.
	 */
	protected long countHqlResult(final String hql) {
		String countHql = prepareCountHql(hql);

		try {
			Long count = findUnique(countHql);
			return count;
		} catch (Exception e) {
			throw new RuntimeException("hql can't be auto count, hql is:" + countHql, e);
		}
	}

	/**
	 * 执行count查询获得本次Hql查询所能获得的对象总数.
	 * 
	 * 本函数只能自动处理简单的hql语句,复杂的hql查询请另行编写count语句查询.
	 */
	protected long countHqlResult(final String hql, final Object... values) {
		String countHql = prepareCountHql(hql);

		try {
			Long count = findUnique(countHql, values);
			return count;
		} catch (Exception e) {
			throw new RuntimeException("hql can't be auto count, hql is:" + countHql, e);
		}
	}

	/**
	 * 执行count查询获得本次Hql查询所能获得的对象总数.
	 * 
	 * 本函数只能自动处理简单的hql语句,复杂的hql查询请另行编写count语句查询.
	 */
	protected long countHqlResult(final String hql, final Map<String, ?> values) {
		String countHql = prepareCountHql(hql);

		try {
			Long count = findUnique(countHql, values);
			return count;
		} catch (Exception e) {
			throw new RuntimeException("hql can't be auto count, hql is:" + countHql, e);
		}
	}

	private String prepareCountHql(String orgHql) {
		String fromHql = orgHql;
		//select子句与order by子句会影响count查询,进行简单的排除.
		fromHql = "from " + StringUtils.substringAfter(fromHql, "from");
		fromHql = StringUtils.substringBefore(fromHql, "order by");

		String countHql = "select count(*) " + fromHql;
		return countHql;
	}

	public int countRows(Class entityClass) {
		String countHql = "select count(*) from " + entityClass.getSimpleName();
		try {
			Long count = findUnique(countHql);
			return count.intValue();
		} catch (Exception e) {
			throw new RuntimeException("hql can't be auto count, hql is:" + countHql, e);
		}
	}

	/**
	 * 取得sessionFactory.
	 */
	public SessionFactory getSessionFactory() {
		return sessionFactory;
	}

	/**
	 * 采用@Autowired按类型注入SessionFactory, 当有多个SesionFactory的时候在子类重载本函数.
	 */
	@Autowired
	public void setSessionFactory(final SessionFactory sessionFactory) {
		this.sessionFactory = sessionFactory;
	}

    @Autowired
    private UtilService utilService;

}