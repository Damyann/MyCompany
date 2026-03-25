const CAL_GET_URL="/api/Admin/Calendar/List";
const CAL_POST_URL="/api/Admin/Calendar/Add_Delete_Edit";

const toJson=async r=>{try{return await r.json()}catch{return null}};

export const postCalendar=async body=>{
  const r=await fetch(CAL_POST_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body??{}),
    cache:"no-store",
  });
  const j=await toJson(r);
  if(!r.ok) throw new Error(j?.error||"Error");
  return j;
};

export const getCalendar=async params=>{
  const sp=new URLSearchParams();
  for(const [k,v] of Object.entries(params||{})){if(v===undefined||v===null||v==="") continue;sp.set(k,String(v));}
  const url=sp.toString()?`${CAL_GET_URL}?${sp.toString()}`:CAL_GET_URL;
  const r=await fetch(url,{cache:"no-store"});
  const j=await toJson(r);
  if(!r.ok) throw new Error(j?.error||"Error");
  return j;
};

// --- GET ---
export const getCalendarList=role=>getCalendar({list:1,role});
export const getCalendarMonth=(role,month,year)=>getCalendar({role,month,year});
export const getDayCard=role=>getCalendar({dayCard:1,role});
export const getBills=role=>getCalendar({bills:1,role});
export const getCalendarSettings=role=>getCalendar({settings:1,role});
export const getCalendarDP=(role,month,year)=>getCalendar({dpCfg:1,role,month,year});
export const getCalendarBonus=(role,month,year)=>getCalendar({bonusCfg:1,role,month,year});

// --- POST actions ---
export const createSchedule=(role,month,year)=>postCalendar({action:"createSchedule",role,month,year});
export const addStaffToMonth=(role,monthId,staffId)=>postCalendar({action:"addStaff",role,monthId,staffId});

export const updateCell=(role,{monthId,staffId,day,raw,shiftCodeId,billCodeId,note})=>postCalendar({
  action:"updateCell",
  role,
  monthId,
  staffId,
  day,
  ...(raw!=null?{raw:(raw??"").toString()}:{}),
  ...(raw==null?{shiftCodeId:shiftCodeId??null,billCodeId:billCodeId??null,note:(note??"").toString().trim()||null}:{}),
});

// DayCard: sections
export const dcSectionReorder=(role,ids)=>postCalendar({action:"dcSectionReorder",role,ids:Array.isArray(ids)?ids:[]});
export const dcSectionCreate=(role,name)=>postCalendar({action:"dcSectionCreate",role,name});
export const dcSectionUpdate=(role,sectionId,name)=>postCalendar({action:"dcSectionUpdate",role,sectionId,name});
export const dcSectionDelete=(role,sectionId)=>postCalendar({action:"dcSectionDelete",role,sectionId});

// DayCard: codes
export const dcCodeAdd=(role,sectionId,code,hours)=>postCalendar({action:"dcCodeAdd",role,sectionId,code,hours});
export const dcCodeUpdate=(role,codeId,code,hours)=>postCalendar({action:"dcCodeUpdate",role,codeId,code,hours});
export const dcCodeDelete=(role,codeId)=>postCalendar({action:"dcCodeDelete",role,codeId});

// Bills: codes
export const billCodeAdd=(role,billId,code)=>postCalendar({action:"billCodeAdd",role,billId,code});
export const billCodeDelete=(role,codeId)=>postCalendar({action:"billCodeDelete",role,codeId});
export const billCodeUpdate=(role,codeId,code,multiplier)=>postCalendar({action:"billCodeUpdate",role,codeId,code,multiplier});

// Settings
export const saveCalendarTotalCfg=(role,totalCfg)=>postCalendar({action:"totalCfgSet",role,totalCfg:totalCfg??{}});
export const saveCalendarDP=(role,month,year,dpCfg)=>postCalendar({action:"dpCfgSet",role,month,year,dpCfg:dpCfg??{}});
export const saveCalendarBonus=(role,month,year,bonusCfg)=>postCalendar({action:"bonusCfgSet",role,month,year,bonusCfg:bonusCfg??{}});
