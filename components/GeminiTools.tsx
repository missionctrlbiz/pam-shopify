
"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2, FileText } from "lucide-react";
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

            setScriptOutput(data.text || "No response generated.");
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

    const systemPrompt = `You are a clinical preceptor helping students structure their psychiatric notes.
You format rough notes into standard Psychiatric SOAP Note structure with clear sections.
Provide professional, educational guidance with clinical reasoning.`;

    async function generateSoap() {
        if (!soapInput.trim()) return;
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

            setSoapOutput(data.text || "No response generated.");
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
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-700 dark:text-blue-400">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                        SOAP Architect ✨
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Turn messy notes into a structured SOAP note.
                    </p>
                </div>
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
                disabled={isSoapLoading || !soapInput.trim()}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSoapLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Structuring...
                    </>
                ) : (
                    <>
                        <span>Structure My Note</span> <Sparkles className="w-4 h-4" />
                    </>
                )}
            </button>

            <ResponseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="SOAP Architect 💬"
                initialContent={soapOutput}
                accentColor="blue"
            />
        </motion.div>
    );
}
