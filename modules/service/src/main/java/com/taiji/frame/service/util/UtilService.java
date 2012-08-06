package com.taiji.frame.service.util;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.taiji.frame.util.ExecuteDAO;

@Service
@Transactional(propagation = Propagation.REQUIRED)
public class UtilService {

	@Autowired
	private ExecuteDAO executeDAO;

	public Date getSysTime() {
		return (Date) executeDAO.getSession().createSQLQuery("select getdate()").uniqueResult();
	}
}
