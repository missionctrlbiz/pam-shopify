import React from "react";
import { Inter, Red_Hat_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["800", "700", "600"] });
const redHat = Red_Hat_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function CheatSheetPage4() {
  return (
    <div className={`h-full flex flex-col ${redHat.className}`}>
      <header className="mb-4 border-b border-slate-200 pb-3 shrink-0">
        <h1 className={`text-xl font-extrabold text-psych-navy tracking-tight ${inter.className}`}>
          Risk Assessment (suicide, violence, grave disability)
        </h1>
      </header>

      <div className="flex-grow grid grid-cols-12 gap-4 auto-rows-min min-h-0">

        {/* Left Column: Suicide Risk Elements & Grave Disability */}
        <div className="col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
            <h2 className={`text-sm font-bold text-psych-navy mb-3 uppercase tracking-wider border-b border-slate-100 pb-1.5 ${inter.className}`}>
              A) Suicide risk: required elements
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-700 font-medium">
              <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Ideation</span>
                <span className="leading-snug mt-0.5">Determine if thoughts are passive versus active and persistent.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Behavior</span>
                <span className="leading-snug mt-0.5">Document past attempts, any aborted attempts, and exact rehearsal.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Active Plan</span>
                <span className="leading-snug mt-0.5">Assess method lethality, extreme specificity, and realistic time frame.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Risk Factors</span>
                <span className="leading-snug mt-0.5">Mood disorder, acute SUD, psychosis, severe agitation, chronic pain.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>True Intent</span>
                <span className="leading-snug mt-0.5">Assess the genuine internal desire and expectation to commit the act.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Protective</span>
                <span className="leading-snug mt-0.5">Reasons for living, dependents, moral values, reliable supports.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Lethal Means</span>
                <span className="leading-snug mt-0.5">Direct access to firearms or medications, and steps already taken.</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-2 rounded border border-slate-100 flex flex-col items-start gap-1">
                <span className={`font-bold text-psych-purple text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 ${inter.className}`}>Clinical State</span>
                <span className="leading-snug mt-0.5">Active intoxication, command AH, profound hopelessness, mixed features.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-grow min-h-0">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col relative overflow-hidden shadow-lg h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <h2 className={`text-[12px] font-bold text-teal-400 mb-2.5 uppercase tracking-widest border-b border-slate-700 pb-1.5 relative z-10 ${inter.className}`}>
                C) Minimum documentation line (use this structure)
              </h2>
              <p className={`text-[10px] text-slate-300 font-mono leading-relaxed bg-slate-800 border border-slate-700 p-2.5 rounded-lg relative z-10 flex-grow shadow-inner`}>
                SI: [denies/passive/active]. Plan: [none/method...]. Intent: [none/unclear/present]. Means: [none/access...]. Past behavior: [none/details]. Protective factors: [...]. Acute risk: [low/mod/high] with clinical rationale. Disposition: [outpatient w safety plan / crisis / ED / hospitalization].
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full shadow-sm">
              <h2 className={`text-[12px] font-bold text-psych-navy mb-2.5 uppercase tracking-widest border-b border-slate-200 pb-1.5 ${inter.className}`}>
                E) Grave disability (basic)
              </h2>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed flex-grow">
                Unable to meet fundamental basic needs for <strong className="font-bold text-slate-900 bg-white px-1 py-0.5 rounded shadow-sm border border-slate-100">food</strong>, <strong className="font-bold text-slate-900 bg-white px-1 py-0.5 rounded shadow-sm border border-slate-100">shelter</strong>, or <strong className="font-bold text-slate-900 bg-white px-1 py-0.5 rounded shadow-sm border border-slate-100">medical care</strong> due directly to mental illness, profound disorganization, or severe catatonia.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Stratification & Violence */}
        <div className="col-span-5 flex flex-col gap-4 h-full min-h-0">
          <div className="bg-slate-50 flex-grow rounded-xl p-4 border border-slate-200 flex flex-col shadow-sm">
            <h2 className={`text-sm font-bold text-psych-navy mb-4 uppercase tracking-wider border-b border-slate-200 pb-2 ${inter.className}`}>
              B) Operational stratification
            </h2>

            <div className="flex flex-col gap-3 flex-grow justify-center">
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden flex shadow-sm">
                <div className="bg-red-500 text-white p-3 flex flex-col justify-center items-center text-center w-28 shrink-0">
                  <span className={`uppercase tracking-widest text-[9px] mb-0.5 font-bold ${inter.className}`}>High acute</span>
                  <span className="text-[9px] leading-tight font-medium opacity-90 block">Level of Care</span>
                </div>
                <div className="p-3 text-red-900 text-[10px] font-medium leading-snug flex items-center bg-white/50">
                  Active SI + plan + intent + lethal access; recent attempt or rehearsal; command AH; severe intoxication; cannot collaborate on safety.
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden flex shadow-sm">
                <div className="bg-amber-500 text-white p-3 flex flex-col justify-center items-center text-center w-28 shrink-0">
                  <span className={`uppercase tracking-widest text-[9px] font-bold ${inter.className}`}>Moderate risk</span>
                </div>
                <div className="p-3 text-amber-900 text-[10px] font-medium leading-snug flex items-center bg-white/50">
                  Active SI with limited plan or unclear internal intent; some protective factors; can collaborate; attempt history increases concern.
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden flex shadow-sm">
                <div className="bg-emerald-500 text-white p-3 flex flex-col justify-center items-center text-center w-28 shrink-0">
                  <span className={`uppercase tracking-widest text-[9px] font-bold ${inter.className}`}>Lower risk</span>
                </div>
                <div className="p-3 text-emerald-900 text-[10px] font-medium leading-snug flex items-center bg-white/50">
                  Passive SI only; no actionable plan/intent; strong protective factors; actively help-seeking; no immediate intoxication.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-200 shrink-0 relative overflow-hidden shadow-sm">
            <div className="absolute -left-5 -bottom-5 w-24 h-24 bg-red-100/50 rounded-full blur-xl pointer-events-none" />
            <h2 className={`text-sm font-bold text-red-800 mb-2 uppercase tracking-wider border-b border-red-200 pb-1.5 relative z-10 ${inter.className}`}>
              D) Violence/HI risk (parallel structure)
            </h2>
            <ul className="text-[11px] text-red-900 space-y-1.5 list-none font-medium relative z-10">
              <li className="flex gap-2 items-start"><span className={`font-bold text-red-500 text-xs ${inter.className}`}>1.</span> <span><strong className="font-bold text-red-700 bg-white/50 px-1 py-0.5 rounded border border-red-100 shadow-sm">HI Sequence:</strong> Ideation &rarr; Specific Target &rarr; Formulated Plan &rarr; Intent &rarr; Lethal Means &rarr; Past Violence History.</span></li>
              <li className="flex gap-2 items-start"><span className={`font-bold text-red-500 text-xs ${inter.className}`}>2.</span> <span><strong className="font-bold text-red-700 bg-white/50 px-1 py-0.5 rounded border border-red-100 shadow-sm">Clinical State:</strong> Assess intoxication, immense paranoia, command AH, and acute external stressors.</span></li>
              <li className="flex gap-2 items-start"><span className={`font-bold text-red-500 text-xs ${inter.className}`}>3.</span> <span><strong className="font-bold text-red-700 bg-white/50 px-1 py-0.5 rounded border border-red-100 shadow-sm">Documentation:</strong> Document protective factors and exact formal disposition rationale.</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
