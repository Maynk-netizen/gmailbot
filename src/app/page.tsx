"use client";

import { motion } from "motion/react";
import Link from "next/link";
import './page.css'
import React from "react";
import { AuroraBackground } from "../components/ui/aurora-background";
import DecryptedText from "@/components/ui/homeElems/DecryptedText"
import InfiniteScroll  from "@/components/ui/homeComps/InfiniteScroll"
import FadeContent from "@/components/ui/homeElems/FadeContent"
import ShinyText from "@/components/ui/homeComps/QNA"
import { Orbitron } from 'next/font/google'; // Import the Orbit font
import FeaturesSectionDemo from '@/components/ui/homeComps/Finalqna'
// import type { ReactNode } from "react";

const orbit = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'], // Specify the weights you need
});
const items = [
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/>},
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content:<img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/> },
  { content: <img src="/ss.png"/>},
  { content:<img src="/ss.png"/> },
];

// interface FadeContentProps {
//   children: ReactNode;
//   blur?: boolean;
//   duration?: number;
//   easing?: string;
//   delay?: number;
//   threshold?: number;
//   initialOpacity?: number;
//   className?: string;
//   style?: React.CSSProperties;
// }

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground id="aura" >
      <motion.div id="aura2"
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        {/* <div className="text-3xl md:text-7xl font-bold dark:text-white text-center ${orbit.className}`}"> */}
        <div className={`text-3xl md:text-7xl font-bold dark:text-white text-center ${orbit.className}`}>
        <DecryptedText
text="NIYOJAKA"
speed={95}
maxIterations={40}
characters="ABCD1234!?"
  animateOn="view"
className="revealed"
parentClassName="all-letters"
encryptedClassName="encrypted"
/>

        </div>
        <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
        
       </div>
       <Link href="/dashboard"><button id="btn" className={`${orbit.className}`}>LET&apos;S GO </button></Link>


             </motion.div>
 
  
<div style={{height: '500px', position: 'relative',backgroundColor: "var(--opacitylimit)" } }id="Scanim">

    <div id="cont" style={{position:"relative",zIndex:"15"}}>
    <FadeContent blur={true} duration={4000} easing="ease-out" initialOpacity={0} >
<span id="bulb_span"><i id="bulb" className="fa-regular fa-lightbulb"></i><i  id="clock"className="fa-regular fa-clock"></i><i className="fa-solid fa-bolt" id="thunder"></i><i className="fa-solid fa-envelope"id="message"></i></span>

</FadeContent>
<div id="advtext" >
<FadeContent style={{color: "var(--line-color)" }} blur={true} duration={4000} easing="ease-out" initialOpacity={5} >
<span id="text1"className={`${orbit.className}`}>    <ShinyText text="Smart solution" disabled={false} speed={6} className='custom-class' /><br /> <ShinyText text="for" disabled={false} speed={6} className='custom-class' /> smart peeps</span>
<span id="text2"className={`${orbit.className}`}>Time saving</span>
<span id="text3"className={`${orbit.className}`}>Boost Productivity</span>
<span id="text4"className={`${orbit.className}`}>Seamless Gmail <br /><span id="text4child">Integration</span></span>
</FadeContent>
</div>


    </div>


  <div id="downimg">
  <InfiniteScroll
    items={items}
    isTilted={true}
    tiltDirection='left'
    autoplay={true}
    autoplaySpeed={2.0}
    autoplayDirection="down"
    pauseOnHover={true}
  /></div>
  <div>
    <div id="upimg"><InfiniteScroll 
    items={items}
    isTilted={true}
    tiltDirection='left'
    autoplay={true}
    autoplaySpeed={2.0}
    autoplayDirection="up"
    pauseOnHover={true}
  /></div>


  <div>
 
  </div>
  </div>
</div>
<div id="QNA_cont">
  <div className={`text-3xl md:text-7xl font-bold ${orbit.className}`} style={{color:"white"}} id="shiny-text"
  >
    <ShinyText text="Why &nbsp;NIYOJAKA " disabled={false} speed={6} className='custom-class' /> ?
  
  </div>

  <span id="reason" ><ShinyText text="Join thousands of busy professionals who are already saving time with our AI auto-replier. Sign up now and take control of your inbox!" disabled={false} speed={6} className='custom-class' /></span>
</div>
<div id="fsDemo" className={`${orbit.className}`}>
    <FeaturesSectionDemo />

</div>
<div className="bgblue" style={{ borderTop: "var(--border-color)" }}>
  <div id="logo_cont">
  <span id="logo" className={`text-3xl md:text-7xl font-bold dark:text-white text-center ${orbit.className}`}>NIYOJAKA</span>
  <hr id="line" style={{ color: "var(--line-color)" }} />
  <span id="bhaukal" style={{color : "var(--line-color)"}}>NIYOJAKA | Your very own mail organizer</span> 
  <div id ="socials" style={{color:"var(--line-color)"}}>
    <span id="socioic"><i className="fa-brands fa-twitter"></i></span>
    <span id="socioic"><i className="fa-brands fa-x-twitter"></i></span>
    <span id="socioic"><i className="fa-brands fa-linkedin-in"></i></span>
    <div id="declarations">2025 NIYOJAKA. All rights reserved.</div>
  </div>
  </div>

</div>



    </AuroraBackground>
    
  );
}
