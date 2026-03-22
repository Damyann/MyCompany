"use client";
import{useState}from"react";
import{motion}from"framer-motion";
import{Trash2}from"lucide-react";

export default function Delete_Button({disabled=false,onClick,label="Изтриване"}){
  const[hov,setHov]=useState(false),on=!disabled;
  return(
    <div className="relative inline-block">
      <motion.div onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)} whileHover={on?{y:-2}:{}} transition={{duration:.35,ease:[.4,0,.2,1]}} className="relative">
        <div className={`relative rounded-[1.25rem] p-[1.5px] shadow-2xl shadow-black/50 ${on?"bg-gradient-to-br from-red-500 via-rose-600 to-red-600":"bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600"}`}>
          <div className={`relative rounded-[1.15rem] overflow-hidden ${on?"bg-black":"bg-neutral-900"}`}>
            <div className={`absolute inset-0 rounded-[1.15rem] ${on?"shadow-[inset_0_1px_1px_rgba(220,38,38,0.28)]":"shadow-[inset_0_1px_1px_rgba(107,114,128,0.18)]"}`}/>
            <motion.div animate={on&&hov?{x:["-100%","200%"],opacity:[0,.14,0]}:{}} transition={{duration:1.2,ease:[.4,0,.2,1]}}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"/>
            <motion.button type="button" onClick={onClick} disabled={!on} whileTap={on?{scale:.98}:{}} className={`relative px-8 py-4 transition-all duration-300 ${on?"cursor-pointer":"cursor-not-allowed"}`}>
              <div className="relative flex items-center gap-4">
                <motion.div animate={on&&hov?{rotate:[0,-4,4,0]}:{}} transition={{duration:.7,ease:[.4,0,.2,1]}} className="relative">
                  <div className={`relative p-3 rounded-lg shadow-lg ${on?"bg-gradient-to-br from-red-600 via-red-700 to-rose-700":"bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900"}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-white/5 to-transparent rounded-lg"/>
                    <Trash2 className={`w-5 h-5 relative z-10 transition-all duration-300 ${on?"text-white drop-shadow-[0_2px_8px_rgba(220,38,38,0.35)]":"text-gray-400"}`}/>
                  </div>
                </motion.div>

                <div className="relative h-9">
                  <motion.div animate={on?{opacity:hov?[.3,.55,.3]:[.2,.4,.2]}:{}} transition={{duration:2,repeat:Infinity,ease:"easeInOut"}}
                    className={`w-[1px] h-full rounded-full ${on?"bg-gradient-to-b from-transparent via-red-500/45 to-transparent":"bg-gradient-to-b from-transparent via-gray-600/35 to-transparent"}`}/>
                </div>

                <div className="relative">
                  <span className={`text-lg font-light tracking-[.14em] transition-all duration-300 ${on?"text-white":"text-gray-500"}`}>{label}</span>
                  <motion.div animate={on&&hov?{scaleX:[0,1],opacity:[0,1]}:{scaleX:0,opacity:0}} transition={{duration:.45,ease:[.4,0,.2,1]}}
                    className={`absolute -bottom-1 left-0 right-0 h-[1px] origin-left ${on?"bg-gradient-to-r from-red-500 via-red-400 to-transparent":""}`}/>
                </div>
              </div>

              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] ${on?"bg-gradient-to-r from-transparent via-red-500/25 to-transparent":"bg-gradient-to-r from-transparent via-gray-600/15 to-transparent"}`}/>
              <motion.div animate={on?{opacity:[.25,.55,.25],scaleX:[.85,1,.85]}:{}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] ${on?"bg-gradient-to-r from-transparent via-red-500/35 to-transparent":"bg-gradient-to-r from-transparent via-gray-600/15 to-transparent"}`}/>
            </motion.button>
          </div>
        </div>

        <motion.div animate={on?{opacity:hov?[.14,.22,.14]:[.1,.16,.1],scale:hov?[1,1.02,1]:[1,1.01,1]}:{}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-full blur-2xl ${on?"bg-gradient-to-r from-transparent via-red-600/45 to-transparent":"bg-gradient-to-r from-transparent via-gray-700/25 to-transparent"}`}/>
      </motion.div>
    </div>
  );
}
