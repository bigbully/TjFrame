package com.taiji.frame.model.para;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue(value = "GPTP")
public class GroupType extends ParaDtl {

	public GroupType() {
		super();
	}

	public GroupType(Long id) {
		super(id);
	}

}
