package com.taiji.frame.model.baseinfo;

import com.taiji.frame.common.util.DateUtil;
import com.taiji.frame.model.util.AutoCompleteable;
import com.taiji.frame.model.util.IdEntity;
import com.taiji.frame.model.util.Jsonable;
import com.taiji.frame.model.util.PropertyName;
import net.sf.json.JSONObject;

import javax.persistence.*;
import java.util.Date;

//人员信息
@Entity
@Table(name = "TB_BASE_PERSON")
public class Person extends IdEntity implements Jsonable, AutoCompleteable {

    private static final long serialVersionUID = 859350993315462795L;

    @PropertyName(name = "班组", subProperty = "name")
    private Group group;
    @PropertyName(name = "部门", subProperty = "name")
    private Dept dept;
    @PropertyName(name = "编号")
    private String code;
    @PropertyName(name = "登录名")
    private String loginName;
    @PropertyName(name = "密码")
    private String loginPassword;
    @PropertyName(name = "姓名")
    private String name;

    //    private Post post;//职务
    @PropertyName(name = "性别")
    private String sex;
    @PropertyName(name = "移动电话")
    private String mobile;
    @PropertyName(name = "电话")
    private String officeTel;
    @PropertyName(name = "短号码")
    private String officePassword;
    @PropertyName(name = "电子邮件")
    private String email;
    @PropertyName(name = "宿舍号码")
    private String dorm;
    @PropertyName(name = "身份证号码")
    private String idtyCard;
    @PropertyName(name = "时间")
    private Date updDate;
    @PropertyName(name = "生日")
    private Date birthday;

    @Transient
    @Override
    public String getJsonObject() {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", this.getId());
        jsonObject.put("dept.name", getDept() == null ? "" : this.getDept().getName());
        jsonObject.put("group.name", this.getGroup() == null ? "" : this.getGroup().getName());
        jsonObject.put("code", this.getCode());
        jsonObject.put("name", this.getName());
//        jsonObject.put("post.name", this.getPost() == null ? "" : this.getPost().getName());
        String sex = "";
        if (this.getSex() != null) {
            if (this.getSex().equals("1")) {
                sex = "男";
            } else {
                sex = "女";
            }
        }
        jsonObject.put("sex", sex);
        jsonObject.put("loginName", getLoginName());
        jsonObject.put("loginPassword", getLoginPassword());
        jsonObject.put("mobile", this.getMobile());
        jsonObject.put("officeTel", this.getOfficeTel());
        jsonObject.put("officePassword", this.getOfficePassword());
        jsonObject.put("email", this.getEmail());
        jsonObject.put("dorm", this.getDorm());
        jsonObject.put("idtyCard", this.getIdtyCard());
        jsonObject.put("updDate", DateUtil.getDateStr(this.getUpdDate()));
        jsonObject.put("birthday", DateUtil.getDateStr(this.getBirthday()));

        return jsonObject.toString();
    }

    @Transient
    @Override
    public String getAutoCompleteJson() {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", this.getId());
        jsonObject.put("name", this.getName());
        return jsonObject.toString();
    }

    public Person() {
    }

    public Person(long id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "GROUP_ID", nullable = true)
    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    @ManyToOne
    @JoinColumn(name = "DP_ID", nullable = true)
    public Dept getDept() {
        return dept;
    }

    public void setDept(Dept dept) {
        this.dept = dept;
    }

    @Column(name = "EMP_CODE", length = 10, nullable = true)
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    @Column(name = "LOGIN_NAME", length = 60, nullable = true)
    public String getLoginName() {
        return loginName;
    }

    public void setLoginName(String loginName) {
        this.loginName = loginName;
    }

    @Column(name = "LOGIN_PASSWORD", length = 60, nullable = true)
    public String getLoginPassword() {
        return loginPassword;
    }

    public void setLoginPassword(String loginPassword) {
        this.loginPassword = loginPassword;
    }

    @Column(name = "EMP_NAME", length = 20, nullable = true)
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

//    @ManyToOne
//    @JoinColumn(name = "POST", nullable = true)
//    public Post getPost() {
//        return post;
//    }
//
//    public void setPost(Post post) {
//        this.post = post;
//    }

    @Column(name = "SEX", length = 1, nullable = true)
    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    @Column(name = "MOBILE", length = 20, nullable = true)
    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    @Column(name = "OFFICE_TEL", length = 40, nullable = true)
    public String getOfficeTel() {
        return officeTel;
    }

    public void setOfficeTel(String officeTel) {
        this.officeTel = officeTel;
    }

    @Column(name = "OFFICE_PASSWORD", length = 40, nullable = true)
    public String getOfficePassword() {
        return officePassword;
    }

    public void setOfficePassword(String officePassword) {
        this.officePassword = officePassword;
    }

    @Column(name = "EMAIL", length = 100, nullable = true)
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Column(name = "DORM", length = 100, nullable = true)
    public String getDorm() {
        return dorm;
    }

    public void setDorm(String dorm) {
        this.dorm = dorm;
    }

    @Column(name = "IDTY_CARD", length = 18, nullable = true)
    public String getIdtyCard() {
        return idtyCard;
    }

    public void setIdtyCard(String idtyCard) {
        this.idtyCard = idtyCard;
    }

    @Column(name = "UPDDATE", nullable = true)
    public Date getUpdDate() {
        return updDate;
    }

    public void setUpdDate(Date updDate) {
        this.updDate = updDate;
    }

    @Column(name = "BIRTHDAY", nullable = true)
    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

}
