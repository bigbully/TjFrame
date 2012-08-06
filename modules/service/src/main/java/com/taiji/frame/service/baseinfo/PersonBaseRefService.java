package com.taiji.frame.service.baseinfo;

import com.taiji.frame.service.util.CrudService;
import com.taiji.frame.model.baseinfo.PersonBaseRef;
import com.taiji.frame.model.util.PropertyName;
import net.sf.json.JSONObject;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PersonBaseRefService extends CrudService<PersonBaseRef> {

	/**
	 * 
	  * Description: 获得当前人员某个基础信息可以显示那些列
	  * @author       BIANDI
	  * @param personId
	  * @param modelName
	  * @return
	  * return_type  String
	  * @exception   
	  * @throws	 
	  * @lastModify  BIANDI 2012-4-16 描述修改内容
	 */
	public PersonBaseRef get(Long personId, String modelName) {
		String hql = "from PersonBaseRef where person.id =:personId and modelName =:modelName";
		Map<String, Object> values = new HashMap<String, Object>();
		values.put("personId", personId);
		values.put("modelName", modelName);
		List<PersonBaseRef> list = dao.find(hql, values);
		if (list == null || list.size() == 0 || list.size() > 1) {
			return null;
		} else {
			return list.get(0);
		}
	}

	/**
	 * 
	  * Description: 根据人员ID和类返回属性MAP
	  * @author       BIANDI
	  * @param personId
	  * @param clazz
	  * @return
	  * return_type  Map<String,String>
	  * @exception   
	  * @throws	 
	  * @lastModify  BIANDI 2012-4-16 描述修改内容
	 */
	public JSONObject getModelPropertisMap(Long personId, Class clazz) {
		JSONObject propertiesMap = new JSONObject();
		PersonBaseRef personBaseRef = get(personId, clazz.getSimpleName());
		if (personBaseRef != null) {
			String[] propertiesArray = personBaseRef.getModelProperties().split(",");
			for (String fieldName : propertiesArray) {
				Field field;
				try {
					field = clazz.getDeclaredField(fieldName.split("\\.")[0]);
					PropertyName propertyName = field.getAnnotation(PropertyName.class);
					propertiesMap.put(fieldName, propertyName.name());
				} catch (SecurityException e) {
					e.printStackTrace();
				} catch (NoSuchFieldException e) {
					e.printStackTrace();
				}
			}
		}
		return propertiesMap;
	}
}
