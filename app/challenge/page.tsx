"use client";

import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { PromptChallenge, challengeScenarios } from "../page";

type DirectPrompt={label:string;prompt:string};

export default function ChallengePage(){
  const [scenario,setScenario]=useState(challengeScenarios[0]);
  const [prompt,setPrompt]=useState("");
  const [startedAt,setStartedAt]=useState<number|null>(null);
  const [seconds,setSeconds]=useState<number|null>(null);
  const [generated,setGenerated]=useState<{prompt:string;seconds:number}|null>(null);
  const [loading,setLoading]=useState(false);
  const [guideStartedAt,setGuideStartedAt]=useState<number|null>(null);
  const [guideValues,setGuideValues]=useState({goal:"",constraints:"",format:""});
  const [humanOutput,setHumanOutput]=useState("");
  const [guidedOutput,setGuidedOutput]=useState("");

  function start(){setPrompt("");setSeconds(null);setGenerated(null);setStartedAt(Date.now());}
  function finish(){if(!startedAt||!prompt.trim())return;setSeconds(Math.max(1,Math.round((Date.now()-startedAt)/1000)));setStartedAt(null);}
  function startGuide(){setGuideStartedAt(Date.now());setGuideValues({goal:"",constraints:"",format:""});}
  async function generateGuide(){
    if(!guideStartedAt||Object.values(guideValues).some(value=>!value.trim()))return;
    setLoading(true);
    try{
      const enriched=[scenario,"Goal: "+guideValues.goal,"Constraints: "+guideValues.constraints,"Preferred output: "+guideValues.format].join("\n");
      const response=await fetch("/api/direct",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation:enriched,passport:{name:"",program:"",goal:""}})});
      if(!response.ok)throw new Error("Could not run comparison");
      const data=await response.json();
      const prompts:DirectPrompt[]=data.prompts||[];
      setGenerated({prompt:prompts[prompts.length-1]?.prompt||prompts[0]?.prompt||"",seconds:Math.max(1,Math.round((Date.now()-guideStartedAt)/1000))});
      setGuideStartedAt(null);
    }finally{setLoading(false);}
  }
  function reset(){setPrompt("");setSeconds(null);setGenerated(null);setStartedAt(null);setGuideStartedAt(null);setGuideValues({goal:"",constraints:"",format:""});setHumanOutput("");setGuidedOutput("");}

  return <main className="challenge-page"><header className="challenge-page-header"><a href="/" className="demo-brand"><span className="robot-mark"><img src="/promptbot.png" alt=""/></span><span className="brand-word">prompt<span>life</span><i>AI</i></span></a><div><a href="/demo"><Play size={15}/>View demo guide</a><a href="/"><ArrowLeft size={15}/>Workspace</a></div></header><section className="challenge-page-intro"><span>Interactive student experiment</span><h1>Prompt Challenge</h1><p>Compare your normal prompt with a guided PromptLife prompt using the same situation, timing method, and transparent rubric.</p></section><div className="challenge-page-body"><PromptChallenge scenario={scenario} setScenario={setScenario} prompt={prompt} setPrompt={setPrompt} startedAt={startedAt} start={start} finish={finish} humanSeconds={seconds} generated={generated} loading={loading} reset={reset} guideStartedAt={guideStartedAt} startGuide={startGuide} guideValues={guideValues} setGuideValues={setGuideValues} generateGuide={generateGuide} humanOutput={humanOutput} setHumanOutput={setHumanOutput} guidedOutput={guidedOutput} setGuidedOutput={setGuidedOutput}/></div></main>;
}
