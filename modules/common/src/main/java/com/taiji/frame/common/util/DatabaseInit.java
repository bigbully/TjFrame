package com.taiji.frame.common.util;

import javax.annotation.*;

@javax.annotation.Resource
public class DatabaseInit {

    @PostConstruct
    public void init() {
        System.out.print("-------------------------------------------------------------------------------------");
    }
}
