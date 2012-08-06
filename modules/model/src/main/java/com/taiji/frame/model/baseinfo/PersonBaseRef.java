package com.taiji.frame.model.baseinfo;

import com.taiji.frame.model.util.IdEntity;

import javax.persistence.*;

import static javax.persistence.GenerationType.SEQUENCE;

@Entity
@Table(name = "TB_BASE_PERSON_BASE_COL_REF")
public class PersonBaseRef extends IdEntity {

	private Person person;
	private String modelName;
	private String modelProperties;

	@Override
	@SequenceGenerator(name = "generator", sequenceName = "SEQ_BASE_PERSON_BASE_COL_REF")
	@Id
	@GeneratedValue(strategy = SEQUENCE, generator = "generator")
	public Long getId() {
		return id;
	}

	@Override
	public void setId(Long id) {
		this.id = id;
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "PERSON_ID", nullable = false)
	public Person getPerson() {
		return person;
	}

	public void setPerson(Person person) {
		this.person = person;
	}

	@Column(name = "MODEL_NAME", nullable = false)
	public String getModelName() {
		return modelName;
	}

	public void setModelName(String modelName) {
		this.modelName = modelName;
	}

	@Column(name = "MODEL_PROPERTIES", nullable = false)
	public String getModelProperties() {
		return modelProperties;
	}

	public void setModelProperties(String modelProperties) {
		this.modelProperties = modelProperties;
	}
}
