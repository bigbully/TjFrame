package com.taiji.frame.model.para;

import com.taiji.frame.model.baseinfo.Dept;

import javax.persistence.*;
import java.util.List;

/**
 * 	传输类型
 *  PARA_TYPE     PARA_CODE     CODE_DESC   
 *  ------------  ------------  --------- 
 *  TRTP             P           集成平台    
 *  TRTP             T           节目源传输    
 *  TRTP             S           卫星上行    
 */
@Entity
@DiscriminatorValue(value = "TRTP")
public class TransType extends ParaDtl implements Comparable<TransType> {
	private List<Dept> depts;

	public TransType() {}

	public TransType(Long id) {
		super(id);
	}

	@Override
	@Transient
	public int compareTo(TransType o) {
		if (this.getId() > o.getId()) {
			return 1;
		} else if (this.getId() == o.getId()) {
			return 0;
		} else {
			return -1;
		}
	}

	@ManyToMany(cascade = { CascadeType.PERSIST }, fetch = FetchType.LAZY)
	@JoinTable(name = "TB_ETMS_BASE_DP_TRTP", joinColumns = @JoinColumn(name = "TRANS_TYPE"), inverseJoinColumns = @JoinColumn(name = "DP_ID"))
	public List<Dept> getDepts() {
		return depts;
	}

	public void setDepts(List<Dept> depts) {
		this.depts = depts;
	}
}
