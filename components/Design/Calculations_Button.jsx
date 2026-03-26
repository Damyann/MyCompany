"use client";
import {motion} from "framer-motion";
export default function Calculations_Button({onClick,className="",disabled=false}){
  return(
    <div className={className}>
      <div className={`group relative inline-block align-middle ${disabled?"opacity-55":""}`}>
        <div className={`relative rounded-[12px] p-[1.5px] shadow-[0_14px_28px_rgba(0,0,0,.34)] ${disabled?"bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600":"bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-600"}`}>
          <div className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40"/>
          <div className={`relative overflow-hidden rounded-[10.5px] ${disabled?"bg-neutral-900":"bg-[linear-gradient(180deg,rgba(2,8,13,.985),rgba(2,6,11,.985))]"}`}>
            <div className={`absolute inset-0 rounded-[10.5px] ${disabled?"":"bg-[radial-gradient(240px_110px_at_50%_-24%,rgba(0,255,210,.16),transparent_56%),radial-gradient(170px_84px_at_84%_18%,rgba(80,170,255,.08),transparent_60%)]"}`}/>
            <div className={`absolute inset-0 rounded-[10.5px] ${disabled?"shadow-[inset_0_1px_1px_rgba(107,114,128,.16)]":"shadow-[inset_0_1px_1px_rgba(16,185,129,.1)]"}`}/>
            <div className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/7 to-transparent opacity-[.07]"/>
            <motion.button type="button" disabled={disabled} onClick={disabled?undefined:onClick} whileTap={disabled?{}:{scale:.985}} className={`relative inline-flex h-[42px] min-w-[154px] items-center justify-center px-5 text-center transition-all duration-300 ${disabled?"cursor-not-allowed":"cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"}`}>
              <span className={`relative inline-block text-center text-[17px] font-extrabold leading-none tracking-[.015em] ${disabled?"text-gray-500":"text-white"}`}>Изчисления
                <span className={`pointer-events-none absolute -bottom-[5px] left-0 right-0 h-[2px] origin-left scale-x-0 opacity-0 transition duration-200 ${disabled?"":"bg-[linear-gradient(90deg,rgba(110,231,183,.98)_0%,rgba(94,234,212,.98)_84%,rgba(94,234,212,.22)_100%)] group-hover:scale-x-100 group-hover:opacity-100"}`}/>
              </span>
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
