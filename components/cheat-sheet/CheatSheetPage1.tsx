import React from "react";
import { Inter, Red_Hat_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["800", "700", "600"] });
const redHat = Red_Hat_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function CheatSheetPage1() {
    return (
        <div className={`h-full flex flex-col ${redHat.className}`}>
            <header className="mb-2 border-b border-slate-200 pb-2 shrink-0">
                <h1 className={`text-xl font-extrabold text-psych-navy tracking-tight ${inter.className}`}>
                    The Interview (fast, complete, repeatable)
                </h1>
            </header>

            {/* Main Grid: Bento Box layout */}
            <div className="flex-grow flex flex-col gap-4 min-h-0">

                {/* Top Full Width Block: A) Opening Script */}
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm shrink-0">
                    <h2 className={`text-sm font-bold text-psych-navy mb-1.5 flex items-center gap-2 border-b border-slate-100 pb-1 ${inter.className}`}>
                        A) Opening script (30–60 seconds)
                    </h2>
                    <ul className="space-y-1 text-[10px] text-slate-700 font-medium">
                        <li className="flex gap-2 items-start">
                            <span className="text-psych-purple mt-0.5 font-bold">•</span>
                            <span><strong className="text-slate-900 border-b border-slate-200">Confirm purpose:</strong> “I will ask structured questions to understand what is happening and what will help.”</span>
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="text-psych-purple mt-0.5 font-bold">•</span>
                            <span><strong className="text-slate-900 border-b border-slate-200">Confidentiality + limits:</strong> self-harm, harm to others, abuse/neglect, court requirements.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="text-psych-purple mt-0.5 font-bold">•</span>
                            <span><strong className="text-slate-900 border-b border-slate-200">Set agenda:</strong> “What are your main concerns today? What would make today helpful?”</span>
                        </li>
                    </ul>
                </div>

                <div className="flex-grow grid grid-cols-12 gap-2 min-h-0">
                    {/* Left Column: B) Core flow */}
                    <div className="col-span-12 lg:col-span-7 bg-slate-50 rounded-xl p-2.5 flex flex-col h-full overflow-hidden border border-slate-200 shadow-sm">
                        <h2 className={`text-sm font-bold text-psych-navy mb-1.5 border-b border-slate-200 pb-1 ${inter.className}`}>
                            B) Core flow (high-yield sequence)
                        </h2>
                        <ul className="space-y-1 text-[10px] text-slate-700 font-medium flex-grow flex flex-col justify-between">
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Chief concern</strong> (patient’s words).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Timeline:</strong> onset &rarr; course &rarr; current severity &rarr; functional impact.</span></li>
                            <li className="flex gap-2 items-start">
                                <span className="text-psych-purple mt-0.5">•</span>
                                <div className="w-full">
                                    <strong className="text-slate-800">Targeted symptom clusters</strong>
                                    <div className="grid grid-cols-2 gap-x-1 mt-0.5 ml-2">
                                        <span className="flex gap-1.5 items-start"><span className="text-slate-400">●</span> Mood (depression; mania/hypomania).</span>
                                        <span className="flex gap-1.5 items-start"><span className="text-slate-400">●</span> Anxiety (GAD/panic/OCD; trauma).</span>
                                        <span className="flex gap-1.5 items-start"><span className="text-slate-400">●</span> Psychosis (delusions/hallucinations/disorganization).</span>
                                        <span className="flex gap-1.5 items-start"><span className="text-slate-400">●</span> Substance/medication effects.</span>
                                        <span className="flex gap-1.5 items-start col-span-2"><span className="text-slate-400">●</span> Sleep, cognition, neuro red flags.</span>
                                    </div>
                                </div>
                            </li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Safety:</strong> SI/HI, self-harm, access to means.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Psych hx:</strong> diagnoses, hospitalizations, therapy, meds, response, adverse effects, adherence.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Substances:</strong> alcohol, cannabis, stimulants, opioids, benzos, nicotine, caffeine (amount + last use).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Medical + current meds</strong> (include steroids, stimulants, thyroid meds).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Social + functioning:</strong> work/school, relationships, housing, legal stressors.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Family hx:</strong> mood, psychosis, SUD, suicide.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Trauma screen + stabilization</strong> (do not force details).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong className="text-slate-800">Strengths + goals:</strong> protective factors; what has worked before.</span></li>
                        </ul>
                    </div>

                    {/* Right Column: Key Domains */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-2 h-full min-h-0">
                        <div className="bg-red-50 rounded-xl p-2.5 border border-red-200 flex-grow flex flex-col shadow-sm">
                            <h2 className={`text-sm font-bold text-red-800 mb-1.5 border-b border-red-200 pb-1 flex items-center gap-2 ${inter.className}`}>
                                <span className="bg-red-500 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-sm">!</span>
                                C) “Can’t miss” screen (1 minute)
                            </h2>
                            <ul className="space-y-1 text-[10px] text-red-900 font-medium flex-grow">
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Mania/hypomania:</strong> decreased need for sleep + increased energy + impairment or risky behavior.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Psychosis:</strong> command hallucinations; paranoia; disorganization.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Catatonia:</strong> immobility, mutism, posturing, waxy flexibility.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Delirium:</strong> acute onset + fluctuating attention/cognition.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Substance/medication:</strong> intoxication/withdrawal; recent medication changes.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Pregnancy/postpartum</strong> (when relevant): mood symptoms and psychosis risk.</span></li>
                                <li className="flex gap-2 items-start"><span className="text-red-500 mt-0.5">•</span> <span><strong className="font-bold">Safety at home:</strong> IPV/coercion; immediate safety needs.</span></li>
                            </ul>
                        </div>

                        <div className="bg-gradient-psych rounded-xl p-2.5 text-white shadow-md shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            <h2 className={`text-[11px] font-bold text-white mb-1 uppercase tracking-widest border-b border-white/20 pb-1 relative z-10 ${inter.className}`}>
                                Clinical note
                            </h2>
                            <p className="text-[10px] font-medium text-blue-50 leading-relaxed italic relative z-10">
                                When the interview derails, use: <br />
                                <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded mt-1.5 inline-block border border-white/20">reflect &rarr; validate &rarr; structure &rarr; redirect.</span>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
