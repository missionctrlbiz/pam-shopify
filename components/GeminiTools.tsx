
"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Wand2, FileText, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ResponseModal } from "./ResponseModal";

export function ScriptDoctor() {
    const [scriptInput, setScriptInput] = useState("");
    const [scriptOutput, setScriptOutput] = useState("");
    const [isScriptLoading, setIsScriptLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const systemPrompt = `You are Tonia Ojomo, a PMHNP mentor and author of "Psychiatric Assessment Mastery". 
Your goal is to provide specific, plain-English clinical scripts for student nurses and PMHNP students.
Keep your tone professional, calm, and supportive. Use simple language, avoid complex jargon.`;

    async function generateScript() {
        if (!scriptInput.trim()) return;
        setIsScriptLoading(true);
        try {
            const prompt = `${systemPrompt}
            
The student is facing this situation: "${scriptInput}"

CRITICAL INSTRUCTIONS:
- Start IMMEDIATELY with the clinical script
- NO introduction, NO "Of course" or "Here's what you can say"
- NO explanations before the script
- Format as direct dialogue they can use word-for-word
- After the script, provide brief clinical reasoning

Output Format (start directly with this):
## Clinical Script

**What to Say:**
"[Exact words to use, formatted as direct quotes]"

**Why This Works:**
[Brief 2-3 sentence explanation of the clinical reasoning]

DO NOT add any introductory text. Start directly with the "Clinical Script" heading.`;

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `API Error: ${response.status}`);
            }

            // Strip any AI introduction/preamble
            let cleanedText = data.text || "No response generated.";

            // Remove common AI introductions
            const introPatterns = [
                /^.*?Of course[.,!].*?(?=\n|$)/i,
                /^.*?Here(?:'s| is).*?(?=\n|$)/i,
                /^.*?Let me.*?(?=\n|$)/i,
                /^.*?I'll.*?(?=\n|$)/i,
                /^.*?This is.*?(?=\n|$)/i,
                /^.*?Certainly.*?(?=\n|$)/i,
            ];

            introPatterns.forEach(pattern => {
                cleanedText = cleanedText.replace(pattern, '');
            });

            // Find the actual start of the clinical script
            const scriptStart = cleanedText.search(/(?:##\s*Clinical\s*Script|\*\*What to Say:\*\*)/i);
            if (scriptStart > 0) {
                cleanedText = cleanedText.substring(scriptStart);
            }

            setScriptOutput(cleanedText.trim());
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error generating script:", error);
            const errorMsg = error instanceof Error ? error.message : "Could not generate response. Please try again.";
            setScriptOutput(`❌ **Error:** ${errorMsg}\n\nPlease check:\n- Your internet connection\n- API key is configured correctly\n- Try again in a moment`);
            setIsModalOpen(true);
        } finally {
            setIsScriptLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-300 p-8"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-700 dark:text-teal-400">
                    <Wand2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                        The Script Doctor ✨
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Stuck on what to say? Generate an empathetic script.
                    </p>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Describe the situation:
                </label>
                <textarea
                    value={scriptInput}
                    onChange={(e) => setScriptInput(e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    rows={3}
                    placeholder="e.g. Patient is angry about waiting, or I need to ask about trauma history..."
                />
            </div>
            <button
                onClick={generateScript}
                disabled={isScriptLoading || !scriptInput.trim()}
                className="w-full bg-teal-600 dark:bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isScriptLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                ) : (
                    <>
                        <span>Generate Script</span> <Wand2 className="w-4 h-4" />
                    </>
                )}
            </button>

            <ResponseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Script Doctor 💬"
                initialContent={scriptOutput}
                accentColor="teal"
            />
        </motion.div>
    );
}

export function SoapArchitect() {
    const [soapInput, setSoapInput] = useState("");
    const [soapOutput, setSoapOutput] = useState("");
    const [isSoapLoading, setIsSoapLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const MAX_USES = 5;
    const STORAGE_KEY = "pam_soap_uses";
    const SUBSCRIBE_KEY = "pam_soap_subscribed";

    const [usesLeft, setUsesLeft] = useState<number>(MAX_USES);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [subEmail, setSubEmail] = useState("");
    const [subName, setSubName] = useState("");
    const [subError, setSubError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            setUsesLeft(parseInt(stored, 10));
        } else {
            localStorage.setItem(STORAGE_KEY, String(MAX_USES));
        }
        setIsSubscribed(localStorage.getItem(SUBSCRIBE_KEY) === "true");
    }, []);

    function handleSubscribe(e: React.FormEvent) {
        e.preventDefault();
        if (!subEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) {
            setSubError("Please enter a valid email address.");
            return;
        }
        localStorage.setItem(SUBSCRIBE_KEY, "true");
        localStorage.setItem("pam_soap_email", subEmail.trim());
        setIsSubscribed(true);
        setSubError("");
    }

    const systemPrompt = `You are a clinical preceptor helping students structure their psychiatric notes.
You format rough notes into standard Psychiatric SOAP Note structure with clear sections.
Provide professional, educational guidance with clinical reasoning.`;

    async function generateSoap() {
        if (!soapInput.trim()) return;
        if (usesLeft <= 0) return;
        setIsSoapLoading(true);
        try {
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const prompt = `${systemPrompt}
            
Take the following rough notes and format them into a standard Psychiatric SOAP Note structure.
            
Rough Notes: "${soapInput}"

CRITICAL INSTRUCTIONS:
- Start IMMEDIATELY with "Psychiatric SOAP Note" as the title
- Use today's date: ${currentDate}
- NO introduction, NO preamble, NO explanations before or after the SOAP note
- Make it look like an authentic clinical note generated in real-time
- Use professional clinical language throughout
- Include patient age and gender if mentioned in notes
            
Output Format (start directly with this):
# Psychiatric SOAP Note
**Patient:** [age]-year-old [gender] **Date of Encounter:** ${currentDate}

**S (Subjective):**
Chief Complaint: [in patient's words]
History of Present Illness (HPI): [detailed narrative]
Psychiatric ROS/Safety: [SI/HI assessment]

**O (Objective):**
Mental Status Exam (MSE):
- Appearance: [observed details]
- Behavior: [observed behaviors]
- Speech: [quality and rate]
- Mood: [patient's stated mood]
- Affect: [observed affect]
- Thought Process: [organized, tangential, etc.]
- Thought Content: [delusions, hallucinations, SI/HI]
- Cognition: [orientation, memory, insight]

**A (Assessment):**
[Clinical summary, diagnostic considerations, risk assessment]

**P (Plan):**
[Treatment plan, interventions, follow-up, safety planning]

DO NOT add any text before the title or after the Plan section. Output ONLY the SOAP note.`;

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `API Error: ${response.status}`);
            }

            // Strip any AI introduction/preamble - find where the actual SOAP note starts
            let cleanedText = data.text || "No response generated.";

            // Remove common AI introductions
            const introPatterns = [
                /^.*?Of course[.,!].*?(?=\n|$)/i,
                /^.*?Here(?:'s| is).*?(?=\n|$)/i,
                /^.*?Let me.*?(?=\n|$)/i,
                /^.*?I'll.*?(?=\n|$)/i,
                /^.*?This is.*?(?=\n|$)/i,
                /^.*?Certainly.*?(?=\n|$)/i,
            ];

            introPatterns.forEach(pattern => {
                cleanedText = cleanedText.replace(pattern, '');
            });

            // Find the actual start of the SOAP note (either # Psychiatric or **Patient:**)
            const soapStart = cleanedText.search(/(?:#\s*Psychiatric\s*SOAP\s*Note|\*\*Patient:\*\*)/i);
            if (soapStart > 0) {
                cleanedText = cleanedText.substring(soapStart);
            }

            // Remove any trailing explanations after the Plan section
            const planEndMatch = cleanedText.match(/(\*\*P \(Plan\):\*\*[\s\S]*?)(?:\n\n(?:Note:|This|I hope|Let me know))/i);
            if (planEndMatch) {
                cleanedText = cleanedText.substring(0, planEndMatch.index! + planEndMatch[1].length);
            }

            setSoapOutput(cleanedText.trim());
            // Decrement usage count on success
            const newUses = Math.max(0, usesLeft - 1);
            setUsesLeft(newUses);
            localStorage.setItem(STORAGE_KEY, String(newUses));
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error generating SOAP note:", error);
            const errorMsg = error instanceof Error ? error.message : "Could not generate response. Please try again.";
            setSoapOutput(`❌ **Error:** ${errorMsg}\n\nPlease check:\n- Your internet connection\n- API key is configured correctly\n- Try again in a moment`);
            setIsModalOpen(true);
        } finally {
            setIsSoapLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 p-8"
        >
            {!isSubscribed ? (
                /* ── Subscription Gate ── */
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-[#041f50] mb-5">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="font-extrabold text-2xl text-slate-900 mb-2">Unlock SOAP Architect™</h3>
                    <p className="text-slate-500 text-sm mb-1 max-w-sm">
                        Get <span className="font-bold text-[#041f50]">5 free structured psychiatric notes</span> — no credit card needed.
                    </p>
                    <p className="text-slate-400 text-xs mb-7 max-w-xs">
                        Enter your email to access the tool and receive clinical tips from Psychiatric Assessment Mastery™.
                    </p>
                    <form onSubmit={handleSubscribe} className="w-full max-w-sm space-y-3">
                        <input
                            type="text"
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            placeholder="First name (optional)"
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-slate-800 text-sm"
                        />
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="email"
                                value={subEmail}
                                onChange={(e) => { setSubEmail(e.target.value); setSubError(""); }}
                                placeholder="Your email address *"
                                required
                                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-slate-800 text-sm"
                            />
                        </div>
                        {subError && <p className="text-red-500 text-xs text-left">{subError}</p>}
                        <button
                            type="submit"
                            className="w-full bg-[#041f50] text-white font-bold py-3 rounded-xl hover:bg-[#052d6e] transition flex items-center justify-center gap-2 shadow-md"
                        >
                            <Sparkles className="w-4 h-4" />
                            Unlock Free Access
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-4 max-w-xs">
                        No spam. You can unsubscribe at any time. Access limited to 5 trial uses.
                    </p>
                </div>
            ) : (
                /* ── Tool UI ── */
                <>
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-700 dark:text-blue-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                            SOAP Architect™ ✨
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Turn messy notes into a structured SOAP note.
                        </p>
                    </div>
                </div>
                {/* Usage Countdown */}
                <div className={`flex-shrink-0 text-center px-3 py-2 rounded-xl border ${
                    usesLeft === 0
                        ? "bg-red-50 border-red-200 text-red-600"
                        : usesLeft <= 2
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                }`}>
                    <div className="text-2xl font-extrabold leading-none">{usesLeft}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">/ {MAX_USES} left</div>
                </div>
                </div>

            {/* Usage progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5">
                <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                        usesLeft === 0 ? "bg-red-400" : usesLeft <= 2 ? "bg-amber-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${(usesLeft / MAX_USES) * 100}%` }}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Paste your rough notes:
                </label>
                <textarea
                    value={soapInput}
                    onChange={(e) => setSoapInput(e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    rows={3}
                    placeholder="e.g. 45yo male, sad for 2 weeks, not sleeping, denies SI, looks disheveled..."
                />
            </div>
            <button
                onClick={generateSoap}
                disabled={isSoapLoading || !soapInput.trim() || usesLeft <= 0}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSoapLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Structuring...
                    </>
                ) : usesLeft <= 0 ? (
                    <span>Usage Limit Reached — Upgrade to Continue</span>
                ) : (
                    <>
                        <span>Structure My Note</span> <Sparkles className="w-4 h-4" />
                    </>
                )}
            </button>

            {usesLeft <= 0 && (
                <p className="text-center text-sm text-red-500 mt-3 font-semibold">
                    You&apos;ve used all 5 free notes. <a href="/#pricing" className="underline hover:text-red-700">Get the Digital Edition</a> to keep going.
                </p>
            )}

            <ResponseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="SOAP Architect 💬"
                initialContent={soapOutput}
                accentColor="blue"
            />
            </>
            )}
        </motion.div>
    );
}
