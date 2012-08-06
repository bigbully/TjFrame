package com.taiji.frame.model.para;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue(value = "DPTP")
public class DeptType extends ParaDtl {
	public DeptType() {}

	public DeptType(Long id) {
		super(id);
	}
}
