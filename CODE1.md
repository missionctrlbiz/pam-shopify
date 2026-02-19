<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Psychiatric Assessment Mastery Workbook | AI Edition</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap');

        :root {
            --primary: #0f766e; /* Teal 700 */
            --secondary: #2dd4bf; /* Teal 400 */
            --accent: #f59e0b; /* Amber 500 */
            --dark: #134e4a; /* Teal 900 */
        }

        body { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Merriweather', serif; }

        /* 3D Workbook Mockup */
        .book-container {
            perspective: 1200px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 580px;
        }
        .book {
            width: 360px;
            height: 480px;
            position: relative;
            transform-style: preserve-3d;
            transform: rotateY(-20deg) rotateX(5deg);
            transition: transform 0.5s ease;
            box-shadow: 30px 30px 60px rgba(0,0,0,0.3);
        }
        .book:hover { transform: rotateY(0deg) scale(1.02); }
        
        .book-cover {
            position: absolute;
            width: 100%;
            height: 100%;
            background: #ffffff;
            border-radius: 4px 8px 8px 4px;
            display: flex;
            flex-direction: column;
            padding: 0;
            backface-visibility: hidden;
            z-index: 2;
            border-left: 14px solid #0f766e;
            overflow: hidden;
        }

        .cover-header {
            background: #0f766e;
            height: 140px;
            padding: 20px;
            color: white;
            text-align: center;
        }
        
        .cover-body {
            padding: 30px;
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .book-spine {
            position: absolute;
            width: 50px;
            height: 100%;
            background: #115e59;
            transform: rotateY(90deg) translateZ(-25px);
            left: -25px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            writing-mode: vertical-rl;
            font-weight: bold;
            letter-spacing: 2px;
            font-size: 14px;
        }

        .book-pages {
            position: absolute;
            width: 350px;
            height: 470px;
            background: #fff;
            transform: translateZ(-25px);
            right: 0;
            top: 5px;
            background: repeating-linear-gradient(90deg, #fff, #fff 2px, #f1f5f9 3px, #f1f5f9 4px);
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        }

        .workbook-banner {
            position: absolute;
            top: 30px;
            right: -30px;
            background: #f59e0b;
            color: #fff;
            padding: 5px 30px;
            transform: rotate(45deg);
            font-weight: bold;
            font-size: 0.8rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .bg-grid-pattern {
            background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
        }

        /* AI Tool Styling */
        .ai-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .ai-card:hover {
            box-shadow: 0 10px 30px -10px rgba(15, 118, 110, 0.2);
            border-color: #2dd4bf;
        }
        .ai-input {
            width: 100%;
            padding: 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 0.75rem;
            transition: border-color 0.2s;
        }
        .ai-input:focus {
            outline: none;
            border-color: #0f766e;
        }
        .ai-result {
            background: #f0fdfa;
            border-left: 4px solid #0f766e;
            padding: 1.5rem;
            margin-top: 1rem;
            border-radius: 0.5rem;
            display: none;
        }
        .markdown-prose h3 { font-weight: bold; margin-bottom: 0.5rem; color: #134e4a; }
        .markdown-prose p { margin-bottom: 0.75rem; }
        .markdown-prose ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.75rem; }
        
        .loading-dots:after {
            content: ' .';
            animation: dots 1s steps(5, end) infinite;
        }
        @keyframes dots {
            0%, 20% { content: ' .'; }
            40% { content: ' ..'; }
            60% { content: ' ...'; }
            80%, 100% { content: ' ....'; }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800">

    <!-- Navigation -->
    <nav class="fixed w-full z-50 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <div class="flex items-center">
                    <i class="fas fa-book-medical text-teal-700 text-3xl mr-2"></i>
                    <span class="font-bold text-xl tracking-tight text-slate-900">PsychAssessment<span class="text-teal-600">Mastery</span></span>
                </div>
                <div class="hidden md:flex space-x-8 items-center">
                    <a href="#ai-tools" class="text-teal-700 font-bold hover:text-teal-900 transition flex items-center gap-1"><i class="fas fa-sparkles"></i> AI Tools</a>
                    <a href="#problem" class="text-slate-600 hover:text-teal-600 font-medium">Why This Workbook?</a>
                    <a href="#features" class="text-slate-600 hover:text-teal-600 font-medium">Inside Look</a>
                    <a href="#pricing" class="bg-teal-700 text-white px-6 py-2 rounded-full font-bold hover:bg-teal-800 transition shadow-lg transform hover:-translate-y-0.5">Start Practicing</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-32 pb-20 overflow-hidden bg-white">
        <div class="absolute right-0 top-0 w-1/2 h-full bg-teal-50 skew-x-12 transform origin-top-right z-0"></div>
        <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div class="text-center lg:text-left mb-12 lg:mb-0">
                    <div class="inline-flex items-center px-4 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-orange-200">
                        <i class="fas fa-pen-alt mr-2"></i> Interactive Workbook Edition
                    </div>
                    <h1 class="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 text-slate-900">
                        Don't Just Read About Assessment.<br>
                        <span class="text-teal-600">Practice It.</span>
                    </h1>
                    <p class="text-lg text-slate-600 mb-8 font-serif leading-relaxed">
                        The "Write-In" Clinical Companion for PMHNP Students and New Grads. Now with <span class="text-teal-700 font-bold"><i class="fas fa-sparkles"></i> AI Clinical Tools</span> to generate practice scripts and check your notes.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <a href="#ai-tools" class="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-xl flex items-center justify-center">
                            Try AI Tools <i class="fas fa-magic ml-2"></i>
                        </a>
                        <a href="#pricing" class="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-teal-600 hover:text-teal-600 transition flex items-center justify-center">
                            Buy Workbook
                        </a>
                    </div>
                </div>

                <div class="book-container">
                    <div class="book">
                        <div class="book-spine">VOLUME 1 • WORKBOOK</div>
                        <div class="book-cover border border-slate-200">
                            <div class="workbook-banner">WORKBOOK</div>
                            <div class="cover-header">
                                <p class="text-teal-200 text-xs tracking-widest uppercase mb-2">Psychiatric Assessment</p>
                                <h2 class="text-4xl font-extrabold leading-none">MASTERY</h2>
                                <p class="text-sm font-medium opacity-90 mt-2">VOLUME I</p>
                            </div>
                            <div class="cover-body bg-grid-pattern">
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700"><i class="fas fa-check"></i></div>
                                        <p class="text-sm text-left font-bold text-slate-700">Interview Scripts</p>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700"><i class="fas fa-check"></i></div>
                                        <p class="text-sm text-left font-bold text-slate-700">SOAP Templates</p>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700"><i class="fas fa-check"></i></div>
                                        <p class="text-sm text-left font-bold text-slate-700">Risk Assessment</p>
                                    </div>
                                </div>
                                <div class="mt-8 border-t border-slate-300 pt-4">
                                    <p class="text-xs font-bold uppercase text-slate-500 mb-1">Author</p>
                                    <p class="text-sm font-bold text-slate-900">Tonia Ojomo, PMHNP</p>
                                </div>
                            </div>
                        </div>
                        <div class="book-pages"></div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- AI Tools Section -->
    <section id="ai-tools" class="py-24 bg-slate-900 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div class="max-w-7xl mx-auto px-4 relative z-10">
            <div class="text-center mb-12">
                <span class="bg-teal-800 text-teal-200 text-xs font-bold uppercase px-3 py-1 rounded-full"><i class="fas fa-sparkles mr-1"></i> Interactive Features</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-white mt-4 mb-4">AI Clinical Companion</h2>
                <p class="text-slate-400 max-w-2xl mx-auto">Experience the power of the workbook. Use these AI tools (powered by Gemini) to practice your skills right now.</p>
            </div>

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Tool 1: Script Doctor -->
                <div class="ai-card p-8">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 text-2xl">
                            <i class="fas fa-comment-medical"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-xl text-slate-900">The Script Doctor ✨</h3>
                            <p class="text-sm text-slate-500">Stuck on what to say? Generate an empathetic script.</p>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Describe the situation:</label>
                        <textarea id="scriptInput" class="ai-input" rows="3" placeholder="e.g. Patient is angry about waiting, or I need to ask about trauma history..."></textarea>
                    </div>
                    <button onclick="generateScript()" class="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition flex items-center justify-center gap-2">
                        <span>Generate Script</span> <i class="fas fa-magic"></i>
                    </button>
                    
                    <div id="scriptResult" class="ai-result">
                        <div class="markdown-prose text-slate-800 text-sm"></div>
                    </div>
                </div>

                <!-- Tool 2: SOAP Architect -->
                <div class="ai-card p-8">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-2xl">
                            <i class="fas fa-file-prescription"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-xl text-slate-900">SOAP Architect ✨</h3>
                            <p class="text-sm text-slate-500">Turn messy notes into a structured SOAP note.</p>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Paste your rough notes:</label>
                        <textarea id="soapInput" class="ai-input" rows="3" placeholder="e.g. 45yo male, sad for 2 weeks, not sleeping, denies SI, looks disheveled..."></textarea>
                    </div>
                    <button onclick="generateSoap()" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <span>Structure My Note</span> <i class="fas fa-magic"></i>
                    </button>
                    
                    <div id="soapResult" class="ai-result border-l-blue-600 bg-blue-50">
                        <div class="markdown-prose text-slate-800 text-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Problem Section -->
    <section id="problem" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold text-slate-900 mb-6">The "Textbook Gap" is Real.</h2>
            <div class="grid md:grid-cols-3 gap-8 text-left">
                <div class="p-6 bg-red-50 rounded-xl border border-red-100">
                    <div class="text-red-500 text-2xl mb-4"><i class="fas fa-ban"></i></div>
                    <h3 class="font-bold text-slate-900 mb-2">Imposter Syndrome</h3>
                    <p class="text-sm text-slate-600">Feeling like you're "faking it" because you don't have a structured way to interview.</p>
                </div>
                <div class="p-6 bg-red-50 rounded-xl border border-red-100">
                    <div class="text-red-500 text-2xl mb-4"><i class="fas fa-file-medical-alt"></i></div>
                    <h3 class="font-bold text-slate-900 mb-2">Documentation Dread</h3>
                    <p class="text-sm text-slate-600">Staring at a blank screen, terrified you'll write something that gets flagged by your preceptor.</p>
                </div>
                <div class="p-6 bg-red-50 rounded-xl border border-red-100">
                    <div class="text-red-500 text-2xl mb-4"><i class="fas fa-exclamation-circle"></i></div>
                    <h3 class="font-bold text-slate-900 mb-2">Safety Blindspots</h3>
                    <p class="text-sm text-slate-600">Worrying you'll miss a subtle sign of suicide risk or mania.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-teal-50">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div class="text-teal-600 text-2xl mb-4"><i class="fas fa-quote-right"></i></div>
                    <h3 class="font-bold text-lg mb-2">Phrase Banks</h3>
                    <p class="text-sm text-slate-500">Exact scripts for trauma, substance use, and redirecting chatty patients.</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div class="text-teal-600 text-2xl mb-4"><i class="fas fa-flag"></i></div>
                    <h3 class="font-bold text-lg mb-2">Preceptor Red Flags</h3>
                    <p class="text-sm text-slate-500">A guide to common mistakes preceptors hate (and how to avoid them).</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div class="text-teal-600 text-2xl mb-4"><i class="fas fa-pen-fancy"></i></div>
                    <h3 class="font-bold text-lg mb-2">SOAP Templates</h3>
                    <p class="text-sm text-slate-500">Fill-in-the-blank frameworks for HPI, MSE, and Assessment sections.</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div class="text-teal-600 text-2xl mb-4"><i class="fas fa-check-double"></i></div>
                    <h3 class="font-bold text-lg mb-2">Capstone Toolkit</h3>
                    <p class="text-sm text-slate-500">The "One-Page Workflow" and self-checklists.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing / Funnel -->
    <section id="pricing" class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-slate-900">Get Clinical Ready Today</h2>
                <p class="text-slate-600 mt-4">Choose the format that fits your study style.</p>
            </div>

            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <!-- Paperback -->
                <div class="border-2 border-teal-500 rounded-2xl p-8 bg-white shadow-2xl relative transform hover:-translate-y-2 transition duration-300">
                    <div class="absolute top-0 right-0 bg-yellow-400 text-teal-900 text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">Recommended</div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">The Physical Workbook</h3>
                    <p class="text-sm text-slate-500 mb-6">Paperback Edition (Shipped)</p>
                    <div class="flex items-baseline mb-8">
                        <span class="text-5xl font-extrabold text-teal-700">$29.99</span>
                        <span class="ml-2 text-slate-400">USD</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Write-in Worksheets</span></li>
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Desk Reference</span></li>
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Prime Shipping</span></li>
                    </ul>
                    <a href="#" class="block w-full bg-teal-600 text-white font-bold text-center py-4 rounded-xl hover:bg-teal-700 transition shadow-lg">Buy on Amazon</a>
                </div>

                <!-- Digital -->
                <div class="border border-slate-200 rounded-2xl p-8 bg-slate-50 hover:border-teal-300 transition duration-300">
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">Digital Edition</h3>
                    <p class="text-sm text-slate-500 mb-6">Kindle / PDF / eBook</p>
                    <div class="flex items-baseline mb-8">
                        <span class="text-5xl font-extrabold text-slate-900">$9.99</span>
                        <span class="ml-2 text-slate-400">USD</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start"><i class="fas fa-check text-slate-400 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Instant Download</span></li>
                        <li class="flex items-start"><i class="fas fa-check text-slate-400 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Searchable Text</span></li>
                    </ul>
                    <a href="#" class="block w-full bg-white border-2 border-slate-300 text-slate-700 font-bold text-center py-4 rounded-xl hover:bg-slate-100 transition">Download eBook</a>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800">
        <p>&copy; 2026 Tonia Ojomo. All Rights Reserved.</p>
    </footer>

    <!-- Gemini API Integration -->
    <script>
        const apiKey = ""; // System will provide API key

        async function callGemini(prompt, resultElementId) {
            const resultDiv = document.getElementById(resultElementId);
            const contentDiv = resultDiv.querySelector('.markdown-prose');
            
            // Show loading
            resultDiv.style.display = 'block';
            contentDiv.innerHTML = '<span class="loading-dots text-slate-500 font-bold">Thinking</span>';

            try {
                // Exponential backoff retry logic
                const maxRetries = 5;
                let attempt = 0;
                let response;
                
                while (attempt < maxRetries) {
                    try {
                        const payload = {
                            contents: [{ parts: [{ text: prompt }] }]
                        };
                        
                        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        break; // Success
                    } catch (e) {
                        attempt++;
                        if (attempt === maxRetries) throw e;
                        const delay = Math.pow(2, attempt - 1) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
                
                // Parse markdown
                contentDiv.innerHTML = marked.parse(text);

            } catch (error) {
                console.error('Error:', error);
                contentDiv.innerHTML = `<span class="text-red-600">Error: Could not generate response. Please try again.</span>`;
            }
        }

        function generateScript() {
            const input = document.getElementById('scriptInput').value;
            if (!input.trim()) return;
            
            const prompt = `You are Tonia Ojomo, a PMHNP mentor and author of "Psychiatric Assessment Mastery". 
            Your goal is to provide a specific, plain-English clinical script for a student nurse or PMHNP student.
            
            The student is facing this situation: "${input}"
            
            Please provide:
            1. A direct, empathetic script they can say word-for-word.
            2. A brief explanation of WHY this script works (clinical reasoning).
            3. Keep the tone professional, calm, and supportive. Use simple language, no complex jargon.`;
            
            callGemini(prompt, 'scriptResult');
        }

        function generateSoap() {
            const input = document.getElementById('soapInput').value;
            if (!input.trim()) return;
            
            const prompt = `You are a clinical preceptor helping a student structure their notes.
            Take the following rough notes and format them into a standard Psychiatric SOAP Note structure.
            
            Rough Notes: "${input}"
            
            Output Format:
            **S (Subjective):** Patient quotes, HPI elements.
            **O (Objective):** Observable data, MSE elements.
            **A (Assessment):** Summary, differential diagnosis consideration, risk.
            **P (Plan):** Next steps, safety plan.
            
            If critical safety info (SI/HI) is missing, add a note in the Plan to "Assess Safety".`;
            
            callGemini(prompt, 'soapResult');
        }
    </script>
</body>
</html>