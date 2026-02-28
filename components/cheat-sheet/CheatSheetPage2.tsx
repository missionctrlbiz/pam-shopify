import React from "react";
import { Inter, Red_Hat_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["800", "700", "600"] });
const redHat = Red_Hat_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function CheatSheetPage2() {
    return (
        <div className={`h-full flex flex-col ${redHat.className}`}>
            <header className="mb-4 border-b border-slate-200 pb-3 shrink-0">
                <h1 className={`text-xl font-extrabold text-psych-navy tracking-tight ${inter.className}`}>
                    PAGE 2 — Mental Status Exam (MSE) Micro-Template
                </h1>
            </header>

            <div className="flex-grow flex flex-col gap-4 min-h-0">
                {/* Top 100% block: A) MSE Domains */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm shrink-0">
                    <h2 className={`text-sm font-bold text-psych-navy border-b border-slate-100 pb-2 mb-3 ${inter.className}`}>A) MSE domains (document in this order)</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ul className="space-y-2 text-[10px] text-slate-700">
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Appearance:</strong> grooming, hygiene, attire, apparent age, weight change cues.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Behavior:</strong> eye contact, cooperation, psychomotor agitation/retardation.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Speech:</strong> rate, volume, prosody, latency, pressured or sparse.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Mood (subjective):</strong> patient's report.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Affect (observed):</strong> range, intensity, congruence, stability.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Thought process:</strong> linear, circumstantial, tangential, flight of ideas, loose/disorganized.</span></li>
                        </ul>
                        <ul className="space-y-2 text-[10px] text-slate-700">
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Thought content:</strong> suicidal or homicidal ideation, delusions, obsessions, guilt, hopelessness, overvalued ideas.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Perception:</strong> hallucinations (modality, command, distress, insight).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Cognition:</strong> alertness, orientation, attention, memory, abstraction (as indicated).</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Insight/judgment:</strong> illness awareness, help-seeking, decision quality.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Impulse control:</strong> current control; recent risky acts.</span></li>
                            <li className="flex gap-2 items-start"><span className="text-psych-purple mt-0.5">•</span> <span><strong>Reliability:</strong> historian quality; collateral alignment.</span></li>
                        </ul>
                    </div>
                </div>

                {/* 100% width grid for Descriptors & Red Flags */}
                <div className="flex-grow grid grid-cols-12 gap-4 h-full min-h-0">
                    {/* Left Column: B) Quick descriptors */}
                    <div className="col-span-7 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
                        <h2 className={`text-sm font-bold text-psych-navy border-b border-slate-200 pb-2 mb-3 ${inter.className}`}>B) Quick descriptors (pick one per line)</h2>
                        <div className="space-y-3.5 text-[10px] text-slate-700 flex-grow pt-2">
                            <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="font-bold text-psych-navy block">Affect</span>
                                <span className="bg-white p-1.5 border border-slate-200 rounded text-slate-600 block shadow-sm text-center">constricted / blunted / flat / labile / expansive</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="font-bold text-psych-navy block">Thought process</span>
                                <span className="bg-white p-1.5 border border-slate-200 rounded text-slate-600 block shadow-sm text-center">linear / circumstantial / tangential / disorganized</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="font-bold text-psych-navy block">Perception</span>
                                <span className="bg-white p-1.5 border border-slate-200 rounded text-slate-600 block shadow-sm text-center">none / auditory hallucinations / visual hallucinations / tactile / depersonalization / derealization</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="font-bold text-psych-navy block">Insight</span>
                                <span className="bg-white p-1.5 border border-slate-200 rounded text-slate-600 block shadow-sm text-center">good / fair / limited / poor</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="font-bold text-psych-navy block">Judgment</span>
                                <span className="bg-white p-1.5 border border-slate-200 rounded text-slate-600 block shadow-sm text-center">intact / fair / impaired</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: C) Red flags */}
                    <div className="col-span-5 bg-red-50 rounded-xl p-4 border border-red-200 flex flex-col relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 w-16 h-16 bg-red-100/50 rounded-full flex items-center justify-center opacity-70">
                            <span className="text-red-400 font-extrabold text-3xl leading-none">!</span>
                        </div>
                        <h2 className={`text-sm font-bold text-red-800 border-b border-red-200 pb-2 mb-3 z-10 relative ${inter.className}`}>C) Red flags (write explicitly)</h2>
                        <ul className="space-y-3.5 text-[10px] text-red-900 z-10 relative mt-4">
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Command hallucinations</strong> (dictating self-harm or harm to others).</span></li>
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Fixed delusions</strong> with risk content (persecution + weapons/retaliation).</span></li>
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Severe disorganization</strong> or total inability to care for self.</span></li>
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Catatonia signs.</strong></span></li>
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Intoxication/withdrawal signs.</strong></span></li>
                            <li className="flex gap-2 items-start"><span className="font-bold text-red-500 mt-0.5">•</span> <span><strong>Poor reality testing</strong> + minimal supports.</span></li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
