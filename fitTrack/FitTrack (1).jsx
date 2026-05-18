import { useState, useEffect, useCallback, useRef } from "react";

const USDA_API_KEY = "DEMO_KEY";

// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  ocean: {
    name: "Ocean Blue", emoji: "🌊",
    light: { bg:"#f7f8fa", surface:"#ffffff", surface2:"#f0f2f5", text:"#1a1a2e", textMuted:"#6b7280", border:"#e5e7eb", accent:"#6366f1", accentLight:"#eef2ff", green:"#10b981", amber:"#f59e0b", red:"#ef4444" },
    dark:  { bg:"#0f0f13", surface:"#1a1a22", surface2:"#22222e", text:"#e8e8f0", textMuted:"#8888aa", border:"#2d2d3f", accent:"#818cf8", accentLight:"#2d2d5e", green:"#34d399", amber:"#fbbf24", red:"#f87171" },
  },
  forest: {
    name: "Forest", emoji: "🌿",
    light: { bg:"#f2f7f2", surface:"#ffffff", surface2:"#eaf3ea", text:"#1a2e1a", textMuted:"#557355", border:"#c8e0c8", accent:"#2d8c4e", accentLight:"#e3f5e8", green:"#16a34a", amber:"#ca8a04", red:"#dc2626" },
    dark:  { bg:"#0d140d", surface:"#132013", surface2:"#1a2e1a", text:"#d4ecd4", textMuted:"#7aaa7a", border:"#234423", accent:"#4ade80", accentLight:"#1a3d20", green:"#4ade80", amber:"#fbbf24", red:"#f87171" },
  },
  sunset: {
    name: "Sunset", emoji: "🌅",
    light: { bg:"#fdf6f0", surface:"#ffffff", surface2:"#fef0e6", text:"#2d1a0e", textMuted:"#9d6a4a", border:"#f0d5bc", accent:"#e8640a", accentLight:"#fff0e6", green:"#059669", amber:"#d97706", red:"#dc2626" },
    dark:  { bg:"#150b04", surface:"#1f1008", surface2:"#2a1810", text:"#f5ddc8", textMuted:"#c4896a", border:"#3d2010", accent:"#fb923c", accentLight:"#3d1f08", green:"#34d399", amber:"#fbbf24", red:"#f87171" },
  },
  slate: {
    name: "Slate", emoji: "🩶",
    light: { bg:"#f1f5f9", surface:"#ffffff", surface2:"#e8edf2", text:"#0f172a", textMuted:"#64748b", border:"#cbd5e1", accent:"#334155", accentLight:"#f1f5f9", green:"#10b981", amber:"#f59e0b", red:"#ef4444" },
    dark:  { bg:"#0a0e17", surface:"#111827", surface2:"#1e2533", text:"#f1f5f9", textMuted:"#94a3b8", border:"#1e2d3d", accent:"#e2e8f0", accentLight:"#1e2533", green:"#34d399", amber:"#fbbf24", red:"#f87171" },
  },
  rose: {
    name: "Rose", emoji: "🌸",
    light: { bg:"#fff5f7", surface:"#ffffff", surface2:"#ffeef1", text:"#2d0a12", textMuted:"#9d4a5a", border:"#fcc5cd", accent:"#e11d48", accentLight:"#fff0f3", green:"#059669", amber:"#d97706", red:"#dc2626" },
    dark:  { bg:"#160509", surface:"#200a10", surface2:"#2d1018", text:"#fde8ec", textMuted:"#d47585", border:"#4a1525", accent:"#fb7185", accentLight:"#3d0f1c", green:"#34d399", amber:"#fbbf24", red:"#f87171" },
  },
};

const initialProfile = {
  name: "Athlete", age: 28, weight: 75,
  heightCm: 175, heightFt: 5, heightIn: 9,
  sex: "male", goal: "maintain", activity: "moderate",
  units: "metric", theme: "ocean", darkMode: false,
};

const ACTIVITY_MULTIPLIERS = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snacks"];
const GREETINGS = [
  n=>`Hi, ${n}! 👋`, n=>`How's it going, ${n}?`, n=>`Good to see you, ${n}!`,
  n=>`Ready to crush it, ${n}?`, n=>`Welcome back, ${n}!`, n=>`Let's go, ${n}! 💪`,
  n=>`Hey ${n}, looking good!`, n=>`What's up, ${n}?`, n=>`Rise and grind, ${n}!`, n=>`You've got this, ${n}!`,
];
const SAMPLE_FOODS = [
  {id:"s1",name:"Chicken Breast (100g)",calories:165,protein:31,carbs:0,fat:3.6,serving:"100g"},
  {id:"s2",name:"Brown Rice (1 cup cooked)",calories:216,protein:5,carbs:45,fat:1.8,serving:"1 cup"},
  {id:"s3",name:"Greek Yogurt (1 cup)",calories:130,protein:22,carbs:9,fat:0.7,serving:"1 cup"},
  {id:"s4",name:"Banana (medium)",calories:105,protein:1.3,carbs:27,fat:0.4,serving:"1 medium"},
  {id:"s5",name:"Almonds (1 oz)",calories:164,protein:6,carbs:6,fat:14,serving:"1 oz"},
];

function imperialToCm(ft, inches) { return ((parseInt(ft)||0)*12 + (parseInt(inches)||0)) * 2.54; }
function cmToFtIn(cm) { const totalIn=(parseFloat(cm)||0)/2.54; const ft=Math.floor(totalIn/12); return {ft, inches:Math.round(totalIn%12)}; }

function calcBMR(p) {
  let w=parseFloat(p.weight)||0, h;
  if (p.units==="imperial") { w*=0.453592; h=imperialToCm(p.heightFt,p.heightIn); }
  else h=parseFloat(p.heightCm)||0;
  return p.sex==="male" ? 10*w+6.25*h-5*p.age+5 : 10*w+6.25*h-5*p.age-161;
}
function calcGoals(p) {
  const bmr=calcBMR(p), tdee=bmr*(ACTIVITY_MULTIPLIERS[p.activity]||1.55);
  return {bmr:Math.round(bmr),tdee:Math.round(tdee),loss:Math.round(tdee-500),maintain:Math.round(tdee),gain:Math.round(tdee+300)};
}
function getTarget(p,c) { return p.goal==="lose"?c.loss:p.goal==="gain"?c.gain:c.maintain; }

export default function FitTrack() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [signedOutToast, setSignedOutToast] = useState(false);

  const [profile, setProfile] = useState(() => {
    try {
      const s=JSON.parse(localStorage.getItem("ft_profile"));
      if (!s) return initialProfile;
      if (s.gender&&!s.sex) s.sex=s.gender;
      if (s.height&&!s.heightCm) { if(s.units==="imperial"){const r=cmToFtIn(s.height*2.54);s.heightFt=r.ft;s.heightIn=r.inches;}else s.heightCm=s.height; }
      return {...initialProfile,...s};
    } catch { return initialProfile; }
  });
  const [foodLog,setFoodLog]=useState(()=>{try{return JSON.parse(localStorage.getItem("ft_log"))||[];}catch{return [];}});
  const [customFoods,setCustomFoods]=useState(()=>{try{return JSON.parse(localStorage.getItem("ft_custom"))||[];}catch{return [];}});

  const [searchQuery,setSearchQuery]=useState("");
  const [searchResults,setSearchResults]=useState([]);
  const [isSearching,setIsSearching]=useState(false);
  const [searchError,setSearchError]=useState("");
  const [selectedFood,setSelectedFood]=useState(null);
  const [addQty,setAddQty]=useState(1);
  const [addMeal,setAddMeal]=useState("Breakfast");
  const [showAddModal,setShowAddModal]=useState(false);
  const [showCustomModal,setShowCustomModal]=useState(false);
  const [editingCustom,setEditingCustom]=useState(null);
  const [customForm,setCustomForm]=useState({name:"",calories:"",protein:"",carbs:"",fat:"",serving:""});
  const [expandedMeals,setExpandedMeals]=useState({Breakfast:true,Lunch:true,Dinner:true,Snacks:true});
  const [editingLogItem,setEditingLogItem]=useState(null);
  const [profileSaved,setProfileSaved]=useState(false);
  const [greeting]=useState(()=>GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);
  const searchTimeout=useRef(null);

  const calcs=calcGoals(profile);
  const targetCalories=getTarget(profile,calcs);
  const todayKey=new Date().toISOString().split("T")[0];
  const todayLog=foodLog.filter(f=>f.date===todayKey);
  const totals=todayLog.reduce((a,f)=>({calories:a.calories+f.calories*f.qty,protein:a.protein+f.protein*f.qty,carbs:a.carbs+f.carbs*f.qty,fat:a.fat+f.fat*f.qty}),{calories:0,protein:0,carbs:0,fat:0});
  const remaining=targetCalories-Math.round(totals.calories);

  useEffect(()=>{localStorage.setItem("ft_profile",JSON.stringify(profile));},[profile]);
  useEffect(()=>{localStorage.setItem("ft_log",JSON.stringify(foodLog));},[foodLog]);
  useEffect(()=>{localStorage.setItem("ft_custom",JSON.stringify(customFoods));},[customFoods]);

  const handleSearch=useCallback(async(q)=>{
    if(!q.trim()){setSearchResults([]);return;}
    const loc=customFoods.filter(f=>f.name.toLowerCase().includes(q.toLowerCase()));
    const samp=SAMPLE_FOODS.filter(f=>f.name.toLowerCase().includes(q.toLowerCase()));
    setIsSearching(true);setSearchError("");
    try {
      const res=await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&api_key=${USDA_API_KEY}`);
      const data=await res.json();
      const api=(data.foods||[]).map(f=>{
        const nut=n=>{const x=f.foodNutrients?.find(i=>i.nutrientName===n);return x?Math.round(x.value*10)/10:0;};
        return {id:"usda_"+f.fdcId,name:f.description,serving:f.servingSize?`${f.servingSize}${f.servingSizeUnit||"g"}`:"100g",calories:nut("Energy"),protein:nut("Protein"),carbs:nut("Carbohydrate, by difference"),fat:nut("Total lipid (fat)"),source:"USDA"};
      });
      setSearchResults([...loc.map(f=>({...f,source:"Custom"})),...samp.map(f=>({...f,source:"Sample"})),...api]);
    } catch {
      setSearchResults([...loc.map(f=>({...f,source:"Custom"})),...samp.map(f=>({...f,source:"Sample"}))]);
      if(q.trim())setSearchError("Live search unavailable. Showing local results.");
    }
    setIsSearching(false);
  },[customFoods]);

  useEffect(()=>{clearTimeout(searchTimeout.current);searchTimeout.current=setTimeout(()=>handleSearch(searchQuery),500);return()=>clearTimeout(searchTimeout.current);},[searchQuery,handleSearch]);

  const addFoodToLog=()=>{if(!selectedFood)return;setFoodLog(p=>[...p,{...selectedFood,id:Date.now()+Math.random(),qty:parseFloat(addQty)||1,meal:addMeal,date:todayKey}]);setShowAddModal(false);setSelectedFood(null);setAddQty(1);setActiveTab("dashboard");};
  const removeFromLog=id=>setFoodLog(p=>p.filter(f=>f.id!==id));
  const updateLogQty=(id,qty)=>setFoodLog(p=>p.map(f=>f.id===id?{...f,qty:parseFloat(qty)||1}:f));
  const saveCustomFood=()=>{
    const food={...customForm,calories:parseFloat(customForm.calories)||0,protein:parseFloat(customForm.protein)||0,carbs:parseFloat(customForm.carbs)||0,fat:parseFloat(customForm.fat)||0,id:editingCustom?"custom_"+editingCustom.id:"custom_"+Date.now(),source:"Custom"};
    if(editingCustom)setCustomFoods(p=>p.map(f=>f.id===editingCustom.id?food:f));else setCustomFoods(p=>[...p,food]);
    setShowCustomModal(false);setEditingCustom(null);setCustomForm({name:"",calories:"",protein:"",carbs:"",fat:"",serving:""});
  };
  const deleteCustomFood=id=>setCustomFoods(p=>p.filter(f=>f.id!==id));
  const saveProfile=()=>{setProfileSaved(true);setTimeout(()=>setProfileSaved(false),2000);};
  const handleSignOut=()=>{localStorage.clear();setProfile(initialProfile);setFoodLog([]);setCustomFoods([]);setShowSettings(false);setSignedOutToast(true);setTimeout(()=>setSignedOutToast(false),2500);};

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const dm=profile.darkMode;
  const T=(THEMES[profile.theme||"ocean"]||THEMES.ocean)[dm?"dark":"light"];
  const {bg,surface,surface2,text,textMuted,border,accent,accentLight,green,amber,red}=T;

  const macroP=Math.round(targetCalories*0.3/4);
  const macroC=Math.round(targetCalories*0.45/4);
  const macroF=Math.round(targetCalories*0.25/9);

  // ── Primitives ────────────────────────────────────────────────────────────
  const Bar=({value,max,color})=>{const pct=Math.min(100,max>0?(value/max)*100:0);return<div style={{background:dm?"#2a2a38":"#e5e7eb",borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.4s"}}/></div>;};
  const Ring=({value,max,color,size=80,stroke=8})=>{const r=(size-stroke)/2,circ=2*Math.PI*r,pct=Math.min(1,max>0?value/max:0);return<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={dm?"#2a2a38":"#e5e7eb"} strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.4s"}}/></svg>;};
  const Card=({children,s})=><div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"16px",...s}}>{children}</div>;
  const Badge=({children,color})=><span style={{background:color+"22",color,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99}}>{children}</span>;

  const F=({label,value,onChange,type="text",min,max,step})=>(
    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:12,color:textMuted,marginBottom:4,fontWeight:500}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} min={min} max={max} step={step}
        style={{width:"100%",padding:"8px 12px",background:surface2,border:`1px solid ${border}`,borderRadius:10,color:text,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
  const S=({label,value,onChange,options})=>(
    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:12,color:textMuted,marginBottom:4,fontWeight:500}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"8px 12px",background:surface2,border:`1px solid ${border}`,borderRadius:10,color:text,fontSize:14,outline:"none",appearance:"none"}}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
  const Btn=({children,onClick,color=accent,outline,small,full,danger,style:sx})=>(
    <button onClick={onClick} style={{background:outline?"transparent":danger?"#ef444415":color,color:outline?color:danger?"#ef4444":"#fff",border:`1.5px solid ${danger?"#ef4444":color}`,borderRadius:10,padding:small?"6px 14px":"10px 20px",fontSize:small?13:14,fontWeight:600,cursor:"pointer",width:full?"100%":undefined,...sx}}>{children}</button>
  );

  // ── Meal section ──────────────────────────────────────────────────────────
  const MealSection=({meal})=>{
    const items=todayLog.filter(f=>f.meal===meal);
    const exp=expandedMeals[meal];
    const mCal=items.reduce((a,f)=>a+f.calories*f.qty,0);
    return(
      <div style={{marginBottom:12}}>
        <div onClick={()=>setExpandedMeals(p=>({...p,[meal]:!p[meal]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",cursor:"pointer",borderBottom:`1px solid ${border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16,fontWeight:600,color:text}}>{meal}</span>
            {items.length>0&&<Badge color={accent}>{items.length} item{items.length>1?"s":""}</Badge>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {items.length>0&&<span style={{fontSize:13,color:textMuted}}>{Math.round(mCal)} kcal</span>}
            <span style={{color:textMuted,fontSize:18,display:"inline-block",transition:"transform 0.2s",transform:exp?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
          </div>
        </div>
        {exp&&(
          <div>
            {items.length===0&&<div style={{padding:"16px 0",textAlign:"center"}}><p style={{color:textMuted,fontSize:13,margin:0}}>No foods logged for {meal}</p></div>}
            {items.map(item=>(
              <div key={item.id} style={{padding:"10px 0",borderBottom:`1px solid ${border}22`,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:14,fontWeight:500,color:text}}>{item.name}</p>
                  <p style={{margin:"2px 0 0",fontSize:12,color:textMuted}}>{item.serving} · {Math.round(item.calories*item.qty)} kcal · P:{Math.round(item.protein*item.qty)}g C:{Math.round(item.carbs*item.qty)}g F:{Math.round(item.fat*item.qty)}g</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {editingLogItem===item.id
                    ?<input type="number" value={item.qty} min="0.1" step="0.1" onChange={e=>updateLogQty(item.id,e.target.value)} onBlur={()=>setEditingLogItem(null)} autoFocus style={{width:48,padding:"4px 6px",background:surface2,border:`1px solid ${border}`,borderRadius:6,color:text,fontSize:13,textAlign:"center"}}/>
                    :<button onClick={()=>setEditingLogItem(item.id)} style={{background:surface2,border:`1px solid ${border}`,borderRadius:6,padding:"4px 8px",color:textMuted,fontSize:12,cursor:"pointer"}}>×{item.qty}</button>
                  }
                  <button onClick={()=>removeFromLog(item.id)} style={{background:"transparent",border:"none",color:red,cursor:"pointer",fontSize:16,padding:4}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  const Dashboard=()=>(
    <div style={{padding:"0 0 80px"}}>
      <div style={{padding:"20px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:text}}>{greeting(profile.name)}</h1>
          <p style={{margin:"2px 0 0",fontSize:13,color:textMuted}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <div style={{width:42,height:42,borderRadius:"50%",background:accentLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:18}}>⚡</span>
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <Card s={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ring value={Math.round(totals.calories)} max={targetCalories} color={accent} size={90} stroke={9}/>
              <div style={{position:"absolute",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:700,color:text}}>{Math.round(totals.calories)}</div>
                <div style={{fontSize:10,color:textMuted}}>kcal</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                {[{l:"Target",v:targetCalories,c:text},{l:"Consumed",v:Math.round(totals.calories),c:accent},{l:"Remaining",v:Math.abs(remaining)+(remaining<0?" over":""),c:remaining>=0?green:red}].map(x=>(
                  <div key={x.l} style={{textAlign:"center"}}><p style={{margin:0,fontSize:11,color:textMuted}}>{x.l}</p><p style={{margin:0,fontSize:15,fontWeight:600,color:x.c}}>{x.v}</p></div>
                ))}
              </div>
            </div>
          </div>
          <div style={{marginTop:14,borderTop:`1px solid ${border}`,paddingTop:14}}>
            {(()=>{const gm={lose:{label:"Daily Deficit Target",val:calcs.loss,color:amber,desc:"Weight Loss"},maintain:{label:"Daily Maintenance",val:calcs.maintain,color:accent,desc:"Maintain Weight"},gain:{label:"Daily Surplus Target",val:calcs.gain,color:green,desc:"Weight Gain"}};const g=gm[profile.goal]||gm.maintain;return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:surface2,borderRadius:10,padding:"10px 14px"}}><div><p style={{margin:0,fontSize:11,color:textMuted}}>{g.label}</p><p style={{margin:"2px 0 0",fontSize:11,color:textMuted}}>{g.desc}</p></div><p style={{margin:0,fontSize:20,fontWeight:700,color:g.color}}>{g.val}<span style={{fontSize:12,fontWeight:400}}> kcal</span></p></div>;})()}
          </div>
        </Card>

        <Card s={{marginBottom:16}}>
          <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:600,color:text}}>Macros</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
            {[{l:"Protein",v:Math.round(totals.protein),t:macroP,c:"#6366f1"},{l:"Carbs",v:Math.round(totals.carbs),t:macroC,c:green},{l:"Fat",v:Math.round(totals.fat),t:macroF,c:amber}].map(m=>(
              <div key={m.l} style={{textAlign:"center"}}>
                <div style={{position:"relative",display:"inline-block"}}>
                  <Ring value={m.v} max={m.t} color={m.c} size={64} stroke={7}/>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}><div style={{fontSize:13,fontWeight:700,color:text}}>{m.v}</div></div>
                </div>
                <p style={{margin:"4px 0 0",fontSize:12,color:textMuted}}>{m.l}</p>
                <p style={{margin:0,fontSize:11,color:textMuted}}>{m.v}/{m.t}g</p>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[{l:"Protein",v:Math.round(totals.protein),t:macroP,c:"#6366f1"},{l:"Carbs",v:Math.round(totals.carbs),t:macroC,c:green},{l:"Fat",v:Math.round(totals.fat),t:macroF,c:amber}].map(m=>(
              <div key={m.l}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:text,fontWeight:500}}>{m.l}</span><span style={{fontSize:12,color:textMuted}}>{m.v}g / {m.t}g</span></div><Bar value={m.v} max={m.t} color={m.c}/></div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,fontSize:15,fontWeight:600,color:text}}>Food Log</h3>
            <Btn small onClick={()=>setActiveTab("search")}>+ Add Food</Btn>
          </div>
          {MEAL_TYPES.map(m=><MealSection key={m} meal={m}/>)}
          {todayLog.length>0&&(
            <div style={{marginTop:12,padding:"12px",background:accentLight,borderRadius:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,textAlign:"center"}}>
                {[{l:"Calories",v:Math.round(totals.calories)},{l:"Protein",v:Math.round(totals.protein)+"g"},{l:"Carbs",v:Math.round(totals.carbs)+"g"},{l:"Fat",v:Math.round(totals.fat)+"g"}].map(x=>(
                  <div key={x.l}><p style={{margin:0,fontSize:14,fontWeight:700,color:accent}}>{x.v}</p><p style={{margin:0,fontSize:10,color:textMuted}}>{x.l}</p></div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FOOD SEARCH
  // ══════════════════════════════════════════════════════════════════════════
  const SearchPage=()=>(
    <div style={{padding:"0 0 80px"}}>
      <div style={{padding:"20px 16px 0",marginBottom:16}}>
        <h1 style={{margin:"0 0 16px",fontSize:22,fontWeight:700,color:text}}>Food Search</h1>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:18,color:textMuted}}>🔍</span>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search foods, ingredients..."
            style={{width:"100%",padding:"12px 12px 12px 40px",background:surface,border:`1px solid ${border}`,borderRadius:12,color:text,fontSize:15,outline:"none",boxSizing:"border-box"}}/>
          {searchQuery&&<button onClick={()=>{setSearchQuery("");setSearchResults([]);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:textMuted,cursor:"pointer",fontSize:18}}>✕</button>}
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:600,color:text}}>Custom Foods</h3>
          <Btn small onClick={()=>{setEditingCustom(null);setCustomForm({name:"",calories:"",protein:"",carbs:"",fat:"",serving:""});setShowCustomModal(true);}}>+ New</Btn>
        </div>
        {customFoods.length===0&&!searchQuery&&<div style={{textAlign:"center",padding:"20px 0",color:textMuted,fontSize:13}}><p>No custom foods yet.<br/>Create one to track your recipes!</p></div>}
        {!searchQuery&&customFoods.map(food=>(
          <Card key={food.id} s={{marginBottom:8,padding:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><p style={{margin:0,fontSize:14,fontWeight:600,color:text}}>{food.name}</p><Badge color={green}>Custom</Badge></div><p style={{margin:0,fontSize:12,color:textMuted}}>{food.serving} · {food.calories} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p></div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditingCustom(food);setCustomForm(food);setShowCustomModal(true);}} style={{background:surface2,border:`1px solid ${border}`,borderRadius:8,padding:"5px 10px",color:text,cursor:"pointer",fontSize:12}}>Edit</button>
                <button onClick={()=>deleteCustomFood(food.id)} style={{background:"transparent",border:`1px solid ${red}44`,borderRadius:8,padding:"5px 10px",color:red,cursor:"pointer",fontSize:12}}>Del</button>
                <button onClick={()=>{setSelectedFood(food);setAddMeal("Breakfast");setAddQty(1);setShowAddModal(true);}} style={{background:accent,border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Add</button>
              </div>
            </div>
          </Card>
        ))}
        {isSearching&&<div style={{textAlign:"center",padding:"24px 0"}}><div style={{display:"inline-block",width:24,height:24,border:`3px solid ${border}`,borderTopColor:accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><p style={{color:textMuted,fontSize:13,marginTop:8}}>Searching...</p></div>}
        {searchError&&<p style={{color:amber,fontSize:12,marginBottom:8}}>⚠ {searchError}</p>}
        {searchQuery&&!isSearching&&searchResults.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:textMuted,fontSize:13}}>No results for "{searchQuery}"</div>}
        {searchResults.map(food=>(
          <Card key={food.id} s={{marginBottom:8,padding:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,marginRight:8}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}><p style={{margin:0,fontSize:14,fontWeight:600,color:text}}>{food.name}</p>{food.source&&<Badge color={food.source==="Custom"?green:food.source==="Sample"?amber:accent}>{food.source}</Badge>}</div><p style={{margin:0,fontSize:12,color:textMuted}}>{food.serving} · {food.calories} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p></div>
              <button onClick={()=>{setSelectedFood(food);setAddMeal("Breakfast");setAddQty(1);setShowAddModal(true);}} style={{background:accent,border:"none",borderRadius:8,padding:"6px 14px",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>Add</button>
            </div>
          </Card>
        ))}
      </div>
      {showAddModal&&selectedFood&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",zIndex:100}}>
          <div style={{background:surface,borderRadius:"20px 20px 0 0",padding:"24px",width:"100%",boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:700,color:text}}>{selectedFood.name}</h3>
            <p style={{margin:"0 0 16px",fontSize:13,color:textMuted}}>{selectedFood.calories} kcal per {selectedFood.serving}</p>
            <F label="Quantity (servings)" type="number" value={addQty} onChange={setAddQty} min="0.1" step="0.1"/>
            <S label="Meal" value={addMeal} onChange={setAddMeal} options={MEAL_TYPES.map(m=>({v:m,l:m}))}/>
            <div style={{background:surface2,borderRadius:10,padding:"10px 12px",marginBottom:16}}><p style={{margin:0,fontSize:13,color:textMuted}}>Estimated: <strong style={{color:text}}>{Math.round(selectedFood.calories*addQty)} kcal</strong> · P:{Math.round(selectedFood.protein*addQty)}g · C:{Math.round(selectedFood.carbs*addQty)}g · F:{Math.round(selectedFood.fat*addQty)}g</p></div>
            <div style={{display:"flex",gap:10}}><Btn full outline onClick={()=>setShowAddModal(false)}>Cancel</Btn><Btn full onClick={addFoodToLog}>Add to Log</Btn></div>
          </div>
        </div>
      )}
      {showCustomModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",zIndex:100}}>
          <div style={{background:surface,borderRadius:"20px 20px 0 0",padding:"24px",width:"100%",boxSizing:"border-box",maxHeight:"85vh",overflowY:"auto"}}>
            <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700,color:text}}>{editingCustom?"Edit":"Create"} Custom Food</h3>
            <F label="Food Name" value={customForm.name} onChange={v=>setCustomForm(p=>({...p,name:v}))}/>
            <F label="Serving Size (e.g. 100g, 1 cup)" value={customForm.serving} onChange={v=>setCustomForm(p=>({...p,serving:v}))}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <F label="Calories (kcal)" type="number" value={customForm.calories} onChange={v=>setCustomForm(p=>({...p,calories:v}))}/>
              <F label="Protein (g)" type="number" value={customForm.protein} onChange={v=>setCustomForm(p=>({...p,protein:v}))}/>
              <F label="Carbs (g)" type="number" value={customForm.carbs} onChange={v=>setCustomForm(p=>({...p,carbs:v}))}/>
              <F label="Fat (g)" type="number" value={customForm.fat} onChange={v=>setCustomForm(p=>({...p,fat:v}))}/>
            </div>
            <div style={{display:"flex",gap:10,marginTop:8}}><Btn full outline onClick={()=>{setShowCustomModal(false);setEditingCustom(null);}}>Cancel</Btn><Btn full onClick={saveCustomFood} sx={{opacity:customForm.name?1:0.5}}>Save</Btn></div>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  const ProfilePage=()=>{
    const [lp,setLp]=useState(profile);
    const [actInfo,setActInfo]=useState(false);
    const lc=calcGoals(lp);
    const lt=getTarget(lp,lc);
    const isMetric=lp.units==="metric";

    const switchUnits=v=>{
      if(v==="imperial"&&lp.units==="metric"){const r=cmToFtIn(lp.heightCm||175);setLp(p=>({...p,units:v,heightFt:r.ft,heightIn:r.inches}));}
      else if(v==="metric"&&lp.units==="imperial"){setLp(p=>({...p,units:v,heightCm:Math.round(imperialToCm(lp.heightFt,lp.heightIn))}));}
      else setLp(p=>({...p,units:v}));
    };

    return(
      <div style={{padding:"0 0 80px"}}>
        <div style={{padding:"20px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:text}}>Profile</h1>
          <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:6,background:surface2,border:`1px solid ${border}`,borderRadius:20,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:text}}>
            ⚙️ Settings
          </button>
        </div>
        <div style={{padding:"0 16px"}}>
          {/* Avatar strip */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"14px 16px"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:accent+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:accent,flexShrink:0}}>
              {(lp.name||"A")[0].toUpperCase()}
            </div>
            <div>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:text}}>{lp.name}</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:textMuted}}>{lp.goal==="lose"?"Weight Loss":lp.goal==="gain"?"Weight Gain":"Maintenance"} · {lc.tdee} kcal TDEE</p>
            </div>
          </div>

          <Card s={{marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:600,color:text}}>Personal Info</h3>
            <F label="Name" value={lp.name} onChange={v=>setLp(p=>({...p,name:v}))}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <F label="Age" type="number" value={lp.age} onChange={v=>setLp(p=>({...p,age:parseInt(v)||0}))}/>
              <S label="Sex" value={lp.sex} onChange={v=>setLp(p=>({...p,sex:v}))} options={[{v:"male",l:"Male"},{v:"female",l:"Female"}]}/>
            </div>
            <F label={`Weight (${isMetric?"kg":"lbs"})`} type="number" value={lp.weight} onChange={v=>setLp(p=>({...p,weight:parseFloat(v)||0}))}/>
            {isMetric
              ?<F label="Height (cm)" type="number" value={lp.heightCm} onChange={v=>setLp(p=>({...p,heightCm:parseFloat(v)||0}))}/>
              :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <F label="Height (ft)" type="number" value={lp.heightFt} onChange={v=>setLp(p=>({...p,heightFt:parseInt(v)||0}))} min="0" max="8"/>
                  <F label="Height (in)" type="number" value={lp.heightIn} onChange={v=>setLp(p=>({...p,heightIn:Math.min(11,parseInt(v)||0)}))} min="0" max="11"/>
               </div>
            }
            <S label="Units" value={lp.units} onChange={switchUnits} options={[{v:"metric",l:"Metric (kg, cm)"},{v:"imperial",l:"Imperial (lbs, ft / in)"}]}/>
          </Card>

          <Card s={{marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:600,color:text}}>Goals & Activity</h3>
            <S label="Goal" value={lp.goal} onChange={v=>setLp(p=>({...p,goal:v}))} options={[{v:"lose",l:"Lose Weight"},{v:"maintain",l:"Maintain Weight"},{v:"gain",l:"Gain Weight"}]}/>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <label style={{fontSize:12,color:textMuted,fontWeight:500}}>Activity Level</label>
                <button onClick={()=>setActInfo(p=>!p)} style={{width:18,height:18,borderRadius:"50%",background:accentLight,border:`1px solid ${accent}44`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:accent,padding:0,lineHeight:1}}>i</button>
              </div>
              {actInfo&&(
                <div style={{background:accentLight,border:`1px solid ${accent}33`,borderRadius:12,padding:"12px",marginBottom:8}}>
                  <p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:accent}}>Activity Level Guide</p>
                  {[{k:"Sedentary",d:"Little or no exercise. Desk job, mostly sitting throughout the day with minimal movement."},
                    {k:"Light",d:"Light exercise 1–3 days/week. Short walks, casual cycling, or light gym sessions."},
                    {k:"Moderate",d:"Moderate exercise 3–5 days/week. Regular gym workouts, jogging, or sports a few times a week."},
                    {k:"Active",d:"Hard exercise 6–7 days/week. Daily intense workouts, physical job, or competitive training."},
                    {k:"Very Active",d:"Very hard exercise twice per day, or a demanding physical job combined with regular training."}
                  ].map(a=>(
                    <div key={a.k} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${accent}22`}}>
                      <p style={{margin:"0 0 2px",fontSize:12,fontWeight:600,color:text}}>{a.k}</p>
                      <p style={{margin:0,fontSize:11,color:textMuted,lineHeight:1.5}}>{a.d}</p>
                    </div>
                  ))}
                  <button onClick={()=>setActInfo(false)} style={{background:"none",border:"none",color:accent,fontSize:12,cursor:"pointer",padding:0,fontWeight:600}}>Close ✕</button>
                </div>
              )}
              <select value={lp.activity} onChange={e=>setLp(p=>({...p,activity:e.target.value}))} style={{width:"100%",padding:"8px 12px",background:surface2,border:`1px solid ${border}`,borderRadius:10,color:text,fontSize:14,outline:"none",appearance:"none"}}>
                <option value="sedentary">Sedentary (desk job, no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (twice/day)</option>
              </select>
            </div>
          </Card>

          <Card s={{marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:600,color:text}}>Calorie Targets</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{l:"BMR",v:lc.bmr,d:"Basal Metabolic Rate",c:textMuted},{l:"TDEE",v:lc.tdee,d:"Maintenance Calories",c:accent},{l:"For Loss",v:lc.loss,d:"−500 kcal/day",c:amber},{l:"For Gain",v:lc.gain,d:"+300 kcal/day",c:green}].map(x=>(
                <div key={x.l} style={{background:surface2,borderRadius:12,padding:"12px",textAlign:"center"}}>
                  <p style={{margin:"0 0 2px",fontSize:11,color:textMuted}}>{x.l}</p>
                  <p style={{margin:"0 0 2px",fontSize:20,fontWeight:700,color:x.c}}>{x.v}</p>
                  <p style={{margin:0,fontSize:10,color:textMuted}}>{x.d}</p>
                </div>
              ))}
            </div>
            <div style={{background:accent+"18",border:`1px solid ${accent}44`,borderRadius:12,padding:"12px",textAlign:"center"}}>
              <p style={{margin:"0 0 2px",fontSize:12,color:textMuted}}>Your daily target</p>
              <p style={{margin:0,fontSize:24,fontWeight:700,color:accent}}>{lt} kcal</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:textMuted}}>{lp.goal==="lose"?"Calorie Deficit":lp.goal==="gain"?"Calorie Surplus":"Maintenance"}</p>
            </div>
          </Card>

          <Btn full onClick={()=>{setProfile(lp);saveProfile();}}>{profileSaved?"✓ Saved!":"Save Profile"}</Btn>
          {profileSaved&&<p style={{textAlign:"center",color:green,fontSize:13,marginTop:8}}>Profile updated successfully!</p>}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SETTINGS DRAWER
  // ══════════════════════════════════════════════════════════════════════════
  const SettingsDrawer=()=>(
    <div style={{position:"fixed",inset:0,zIndex:200}}>
      <div onClick={()=>setShowSettings(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)"}}/>
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:surface,borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",boxSizing:"border-box",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:border,borderRadius:99,margin:"0 auto 20px"}}/>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700,color:text}}>Settings</h2>

        {/* Dark mode */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:surface2,borderRadius:14,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{dm?"🌙":"☀️"}</span>
            <div><p style={{margin:0,fontSize:14,fontWeight:600,color:text}}>Dark Mode</p><p style={{margin:0,fontSize:12,color:textMuted}}>{dm?"Currently dark":"Currently light"}</p></div>
          </div>
          <button onClick={()=>setProfile(p=>({...p,darkMode:!p.darkMode}))} style={{width:48,height:26,borderRadius:99,background:dm?accent:"#d1d5db",border:"none",cursor:"pointer",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:dm?24:4,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
          </button>
        </div>

        {/* Theme picker */}
        <p style={{fontSize:12,fontWeight:600,color:textMuted,margin:"18px 0 10px",textTransform:"uppercase",letterSpacing:"0.08em"}}>App Theme</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
          {Object.entries(THEMES).map(([key,th])=>{
            const tc=th[dm?"dark":"light"];
            const active=(profile.theme||"ocean")===key;
            return(
              <button key={key} onClick={()=>setProfile(p=>({...p,theme:key}))}
                style={{background:tc.surface,border:`2px solid ${active?tc.accent:tc.border}`,borderRadius:14,padding:"12px",cursor:"pointer",textAlign:"left",transition:"border-color 0.15s",boxSizing:"border-box"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:18}}>{th.emoji}</span>
                  <span style={{fontSize:13,fontWeight:600,color:tc.text,flex:1}}>{th.name}</span>
                  {active&&<span style={{fontSize:14,color:tc.accent}}>✓</span>}
                </div>
                <div style={{display:"flex",gap:5}}>
                  {[tc.accent,tc.green,tc.amber,tc.red].map((c,i)=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:c}}/>)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <p style={{fontSize:12,fontWeight:600,color:textMuted,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Account</p>
        <div style={{background:surface2,borderRadius:14,overflow:"hidden",marginBottom:12}}>
          {[
            {icon:"📊",label:"Export Data",desc:"Download your food log as JSON",action:()=>{const d=JSON.stringify({profile,foodLog,customFoods},null,2);const b=new Blob([d],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="fittrack_data.json";a.click();}},
            {icon:"🗑️",label:"Clear Food Log",desc:"Remove all logged foods",action:()=>{if(window.confirm("Clear all logged foods?")){ setFoodLog([]);setShowSettings(false);}}},
            {icon:"🔄",label:"Reset Profile",desc:"Restore default settings",action:()=>{if(window.confirm("Reset your profile to defaults?")){ setProfile(initialProfile);setShowSettings(false);}}},
          ].map((item,i,arr)=>(
            <button key={item.label} onClick={item.action} style={{width:"100%",background:"none",border:"none",borderBottom:i<arr.length-1?`1px solid ${border}`:"none",padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <span style={{fontSize:18}}>{item.icon}</span>
              <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:500,color:text}}>{item.label}</p><p style={{margin:0,fontSize:12,color:textMuted}}>{item.desc}</p></div>
              <span style={{color:textMuted,fontSize:16}}>›</span>
            </button>
          ))}
        </div>

        <button onClick={handleSignOut} style={{width:"100%",background:"#ef444415",border:"1.5px solid #ef444444",borderRadius:12,padding:"12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#ef4444",fontSize:14,fontWeight:600,marginBottom:12}}>
          🚪 Sign Out
        </button>
        <button onClick={()=>setShowSettings(false)} style={{width:"100%",background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:"11px",cursor:"pointer",color:textMuted,fontSize:14,fontWeight:500}}>
          Close
        </button>
      </div>
    </div>
  );

  const tabs=[{id:"dashboard",label:"Dashboard",icon:"📊"},{id:"search",label:"Search",icon:"🔍"},{id:"profile",label:"Profile",icon:"👤"}];

  return(
    <div style={{background:bg,minHeight:"100vh",fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",color:text}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{transition:background-color 0.25s,color 0.25s,border-color 0.25s} input,select,button{transition:none}`}</style>

      {/* Signed-out toast */}
      {signedOutToast&&<div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",background:green,color:"#fff",borderRadius:12,padding:"10px 20px",fontSize:14,fontWeight:600,zIndex:500,whiteSpace:"nowrap"}}>Signed out successfully ✓</div>}

      <div style={{maxWidth:430,margin:"0 auto",position:"relative"}}>
        {activeTab==="dashboard"&&<Dashboard/>}
        {activeTab==="search"&&<SearchPage/>}
        {activeTab==="profile"&&<ProfilePage/>}
        {showSettings&&<SettingsDrawer/>}

        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:surface,borderTop:`1px solid ${border}`,display:"flex",zIndex:50}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:22}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:activeTab===t.id?600:400,color:activeTab===t.id?accent:textMuted}}>{t.label}</span>
              {activeTab===t.id&&<div style={{width:20,height:2.5,background:accent,borderRadius:99}}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
