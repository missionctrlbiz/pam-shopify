import React from "react";
import { Inter, Red_Hat_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["800", "700", "600"] });
const redHat = Red_Hat_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function CheatSheetPage3() {
    return (
        <div className={`h-full flex flex-col ${redHat.className}`}>
            <header className="mb-4 border-b border-slate-200 pb-3 shrink-0">
                <h1 className={`text-xl font-extrabold text-psych-navy tracking-tight ${inter.className}`}>
                    Diagnostic Reasoning
                </h1>
            </header>

            <div className="flex-grow flex flex-col gap-4 min-h-0">

                {/* Top 100% block: A) Stepwise diagnostic algorithm */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm shrink-0">
                    <h2 className={`text-sm font-bold text-psych-navy border-b border-slate-100 pb-2 mb-3 ${inter.className}`}>A) Stepwise diagnostic algorithm</h2>
                    <ul className="space-y-2 text-[10px] text-slate-700">
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Rule out medical/substance first:</strong> new onset, atypical age, acute change, fluctuating attention → consider delirium/medical causes.</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Identify the dominant syndrome:</strong> depressive, manic/hypomanic, anxious, psychotic, trauma, OCD, neurocognitive.</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Time course:</strong> hours–days (intox/withdrawal, delirium, brief psychosis); weeks (major depression, mania/hypomania, trauma flare); months–years (persistent depression, personality pathology, chronic psychosis).</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Functional impairment:</strong> work/school, relationships, self-care.</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Match DSM pattern:</strong> criteria + duration + exclusions (substance/medical).</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Write top 3 differentials:</strong> each with "why" and "why not."</span></li>
                        <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Add specifiers when appropriate:</strong> severity, remission, with anxious distress, with psychotic features, etc.</span></li>
                    </ul>
                </div>

                {/* 100% width grid for Decision Trees and Formula */}
                <div className="flex-grow grid grid-cols-12 gap-4 h-full min-h-0">
                    {/* Left Column: B) High-yield mini decision trees */}
                    <div className="col-span-7 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col pt-3">
                        <h2 className={`text-sm font-bold text-psych-navy border-b border-slate-200 pb-2 mb-2 ${inter.className}`}>B) High-yield mini decision trees</h2>
                        <div className="space-y-4 text-[10px] text-slate-700 flex-grow mt-1">
                            <div>
                                <h3 className={`font-bold text-psych-purple mb-1.5 uppercase tracking-wide ${inter.className}`}>1) Depression vs bipolar spectrum</h3>
                                <ul className="space-y-1.5 border-l-2 border-psych-purple/20 pl-3 ml-1">
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Any history of increased energy + decreased need for sleep + impairment/risk behaviors?</span></li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>If yes → treat as bipolar spectrum until proven otherwise (especially before antidepressant monotherapy).</span></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className={`font-bold text-blue-500 mb-1.5 uppercase tracking-wide ${inter.className}`}>2) Psychosis: primary vs mood vs substance/med</h3>
                                <ul className="space-y-1.5 border-l-2 border-blue-500/20 pl-3 ml-1">
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Temporal link to intoxication/withdrawal or med change? → substance/medication-induced more likely.</span></li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Psychosis only during mood episodes? → mood disorder with psychotic features vs schizoaffective differential.</span></li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Psychosis for 2+ weeks without mood symptoms? → schizophrenia spectrum/schizoaffective considerations (timeline matters).</span></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className={`font-bold text-emerald-600 mb-1.5 uppercase tracking-wide ${inter.className}`}>3) Anxiety vs trauma vs OCD</h3>
                                <ul className="space-y-1.5 border-l-2 border-emerald-600/20 pl-3 ml-1">
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Trauma exposure + re-experiencing/avoidance/hyperarousal → trauma spectrum pattern.</span></li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Intrusive thoughts + compulsions/rituals → OCD spectrum pattern.</span></li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-400 mt-0.5">•</span> <span>Excessive worry most days + tension/restlessness → generalized anxiety disorder pattern.</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: C) Diagnostic write-up formula */}
                    <div className="col-span-5 bg-gradient-psych text-white rounded-xl p-4 shadow-md h-full relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2" />
                        <h2 className={`text-sm font-bold text-white border-b border-white/20 pb-2 mb-4 relative z-10 ${inter.className}`}>C) Diagnostic write-up formula (copy/paste)</h2>
                        <div className="bg-psych-navy/50 border border-white/10 rounded-lg p-3 relative z-10 text-[11px] leading-relaxed flex-grow flex items-center shadow-inner">
                            <p className="italic font-medium text-blue-50">
                                "Presentation most consistent with <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[Diagnosis]</span> given <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[core criteria]</span>, duration of <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[timeframe]</span>, and impairment in <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[domains]</span>. Less consistent with <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[Differential Diagnosis]</span> because <span className="bg-white/20 text-white px-1 rounded not-italic font-bold">[missing criterion/exclusion]</span>."
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
