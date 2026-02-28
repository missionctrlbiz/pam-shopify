import React from "react";
import { Inter, Red_Hat_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["800", "700", "600"] });
const redHat = Red_Hat_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function CheatSheetPage5() {
    return (
        <div className={`h-full flex flex-col ${redHat.className}`}>
            <header className="mb-4 border-b border-slate-200 pb-3 shrink-0">
                <h1 className={`text-xl font-extrabold text-psych-navy tracking-tight ${inter.className}`}>
                    Documentation + Plan (SOAP that shows your reasoning)
                </h1>
            </header>

            <div className="flex-grow grid grid-cols-12 gap-5 auto-rows-min min-h-0">

                {/* Left Column: SOAP Skeleton */}
                <div className="col-span-8 bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden h-full flex flex-col">
                    <h2 className={`text-sm font-bold text-psych-navy mb-4 uppercase tracking-wider border-b border-slate-100 pb-2 ${inter.className}`}>
                        A) SOAP skeleton (tight, defensible)
                    </h2>

                    <div className="flex flex-col flex-grow gap-4">
                        {/* S */}
                        <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-grow shadow-sm">
                            <div className="bg-psych-purple text-white w-12 flex items-center justify-center shrink-0">
                                <span className={`text-2xl font-black ${inter.className}`}>S</span>
                            </div>
                            <div className="p-3">
                                <span className={`text-[10px] font-bold text-psych-purple uppercase tracking-widest block mb-1 ${inter.className}`}>Subjective</span>
                                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">CC + direct patient quote; detailed HPI (timeline, severity, specific triggers, and functional impairment); active safety (SI/HI/self-harm); sleep/appetite/energy/concentration; psychiatric history + full meds response/adherence/SEs; substances (exact amount + last use); active medical meds/allergies; social/trauma (as clinically relevant).</p>
                            </div>
                        </div>

                        {/* O */}
                        <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-grow shadow-sm">
                            <div className="bg-blue-500 text-white w-12 flex items-center justify-center shrink-0">
                                <span className={`text-2xl font-black ${inter.className}`}>O</span>
                            </div>
                            <div className="p-3">
                                <span className={`text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1 ${inter.className}`}>Objective</span>
                                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">Documented vitals (if available on the unit); fully structured Mental Status Exam (MSE); formally reviewed collateral information/past outside records (if any were utilized).</p>
                            </div>
                        </div>

                        {/* A */}
                        <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-grow shadow-sm">
                            <div className="bg-emerald-600 text-white w-12 flex items-center justify-center shrink-0">
                                <span className={`text-2xl font-black ${inter.className}`}>A</span>
                            </div>
                            <div className="p-3">
                                <span className={`text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1 ${inter.className}`}>Assessment</span>
                                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">Primary Diagnosis + exact criteria anchors met; top 2–3 closest differentials (explicitly state why AND why not); concise clinical formulation (bio/psycho/social drivers); exact risk level + full stated rationale.</p>
                            </div>
                        </div>

                        {/* P */}
                        <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-grow shadow-sm">
                            <div className="bg-amber-500 text-white w-12 flex items-center justify-center shrink-0">
                                <span className={`text-2xl font-black ${inter.className}`}>P</span>
                            </div>
                            <div className="p-3">
                                <span className={`text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1 ${inter.className}`}>Plan</span>
                                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">Diagnostics ordered (labs/medical eval when clinically indicated; formally administered rating scales); outlined treatment (exact therapy target + medication plan with specific monitoring); formal safety plan + explicit means restriction; overall health promotion (sleep, exercise, abstaining from substances, limiting caffeine); next follow-up interval + exact contingency plan.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Plan Quality Checklist */}
                <div className="col-span-4 flex flex-col gap-5 h-full min-h-0">
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white shadow-xl flex flex-col flex-grow relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

                        <h2 className={`text-sm font-bold text-teal-400 mb-5 uppercase tracking-wider border-b border-slate-700 pb-2 relative z-10 flex items-center gap-2 ${inter.className}`}>
                            <span className="bg-teal-500/20 text-teal-300 w-5 h-5 rounded flex items-center justify-center text-[10px] shadow-sm">B</span>
                            Plan quality checklist (5 checks)
                        </h2>

                        <ul className="space-y-4 text-[11px] text-slate-300 flex-grow relative z-10 font-medium">
                            <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-teal-400 font-black text-sm leading-none mt-0.5 shrink-0 select-none">✓</span>
                                <span>Plan directly matches the primary diagnosis and <strong className="text-white font-bold">current risk level</strong>.</span>
                            </li>
                            <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-teal-400 font-black text-sm leading-none mt-0.5 shrink-0 select-none">✓</span>
                                <span>Includes <strong className="text-white font-bold">monitoring parameters</strong> + exact timeframe.</span>
                            </li>
                            <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-teal-400 font-black text-sm leading-none mt-0.5 shrink-0 select-none">✓</span>
                                <span>States <strong className="text-white font-bold">what to do if symptoms worsen</strong> (clear contingency plan).</span>
                            </li>
                            <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-teal-400 font-black text-sm leading-none mt-0.5 shrink-0 select-none">✓</span>
                                <span>Addresses <strong className="text-white font-bold">sleep and substances</strong> when clinically relevant.</span>
                            </li>
                            <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-teal-400 font-black text-sm leading-none mt-0.5 shrink-0 select-none">✓</span>
                                <span>Documents <strong className="text-white font-bold">shared decision-making</strong> and patient understanding.</span>
                            </li>
                        </ul>

                        <div className="mt-5 pt-4 border-t border-slate-700 relative z-10">
                            <p className={`text-[9px] text-slate-500 font-black uppercase tracking-widest text-center leading-relaxed ${inter.className}`}>
                                Education-only reference. Not a substitute for clinical judgment, local policy, or emergency protocols.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
