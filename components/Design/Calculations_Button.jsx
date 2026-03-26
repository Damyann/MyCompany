"use client";
import { motion } from "framer-motion";
const EASE=[0.4,0,0.2,1];
const CalcIcon=({className=""})=>(
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M7.2 4.9h9.6c1.1 0 2 .9 2 2v10.2c0 1.1-.9 2-2 2H7.2c-1.1 0-2-.9-2-2V6.9c0-1.1.9-2 2-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/>
    <path d="M8 8.5h8" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 11.8h2.1M12.9 11.8H15M9 15.2h2.1M12.9 15.2H15" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/>
  </svg>
);
export default function Calculations_Button({onClick,className="",disabled=false}){
  return (
    <div className={className}>
      <div className={`relative inline-block align-middle ${disabled?"opacity-55":""}`}>
        <div className={`relative rounded-[12px] p-px shadow-[0_14px_28px_rgba(0,0,0,.34)] ${disabled?"bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600":"bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-600"}`}>
          <div className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40"/>
          <div className={`relative overflow-hidden rounded-[11px] ${disabled?"bg-neutral-900":"bg-[linear-gradient(180deg,rgba(2,8,13,.985),rgba(2,6,11,.985))]"}`}>
            <div className={`absolute inset-0 rounded-[11px] ${disabled?"":"bg-[radial-gradient(260px_120px_at_50%_-22%,rgba(0,255,210,.16),transparent_56%),radial-gradient(180px_90px_at_84%_18%,rgba(80,170,255,.08),transparent_60%)]"}`}/>
            <div className={`absolute inset-0 rounded-[11px] ${disabled?"shadow-[inset_0_1px_1px_rgba(107,114,128,0.16)]":"shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]"}`}/>
            <div className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/7 to-transparent opacity-[.07]"/>
            <motion.button type="button" disabled={disabled} onClick={disabled?undefined:onClick} whileTap={disabled?{}:{scale:.985}} className={`relative inline-flex h-[42px] items-center px-4 transition-all duration-300 ${disabled?"cursor-not-allowed":"cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"}`}>
              <div className="relative flex items-center gap-2.5">
                <div className="relative">
                  <div className={`relative rounded-[8px] p-[5px] shadow-lg ${disabled?"bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900":"bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-700"}`}>
                    <div className={`absolute inset-0 rounded-[8px] ${disabled?"":"bg-[radial-gradient(120px_60px_at_50%_-10%,rgba(190,255,244,.18),transparent_55%),radial-gradient(90px_45px_at_82%_18%,rgba(80,170,255,.08),transparent_58%)]"}`}/>
                    <div className={`absolute inset-0 rounded-[8px] blur-md ${disabled?"bg-gray-500/10":"bg-emerald-500/14"}`}/>
                    <div className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-white/12 via-white/4 to-transparent"/>
                    <CalcIcon className={`relative z-10 h-[18px] w-[18px] ${disabled?"text-gray-400":"text-white drop-shadow-[0_2px_10px_rgba(16,185,129,0.2)]"}`}/>
                  </div>
                </div>
                <div className="relative h-5">
                  <motion.div animate={disabled?{}:{opacity:[.18,.36,.18]}} transition={{duration:2,repeat:Infinity,ease:"easeInOut"}} className={`h-full w-px rounded-full ${disabled?"bg-gradient-to-b from-transparent via-gray-600/35 to-transparent":"bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent"}`}/>
                </div>
                <div className="relative">
                  <span className={`text-[14px] leading-none font-light tracking-[.03em] ${disabled?"text-gray-500":"text-white"}`}>Изчисления</span>
                  <motion.div animate={disabled?{}:{scaleX:[.7,1,.7],opacity:[.35,1,.35]}} transition={{duration:2.4,repeat:Infinity,ease:EASE}} className={`absolute -bottom-1 left-0 right-0 h-px origin-left ${disabled?"":"bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent"}`}/>
                </div>
              </div>
              <div className={`absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 ${disabled?"bg-gradient-to-r from-transparent via-gray-600/15 to-transparent":"bg-gradient-to-r from-transparent via-emerald-500/16 to-transparent"}`}/>
              <motion.div animate={disabled?{}:{opacity:[.22,.42,.22],scaleX:[.9,1,.9]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}} className={`absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 ${disabled?"bg-gradient-to-r from-transparent via-gray-600/15 to-transparent":"bg-gradient-to-r from-transparent via-emerald-500/18 to-transparent"}`}/>
            </motion.button>
          </div>
        </div>
        <motion.div animate={disabled?{}:{opacity:[.06,.1,.06],scale:[1,1.006,1]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}} className={`pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-4/5 -translate-x-1/2 rounded-full blur-lg ${disabled?"bg-gradient-to-r from-transparent via-gray-700/18 to-transparent":"bg-gradient-to-r from-transparent via-emerald-600/16 to-transparent"}`}/>
      </div>
    </div>
  );
}
