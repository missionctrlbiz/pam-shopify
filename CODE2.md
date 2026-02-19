<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Psychiatric Assessment Mastery Workbook | Tonia Ojomo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
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
            width: 360px; /* Wider for workbook feel */
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
            border-left: 14px solid #0f766e; /* Spine binding */
            overflow: hidden;
        }

        /* Cover Design based on Workbook Aesthetic */
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

        /* Diagonal 'Workbook' Banner */
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

        /* Grid Pattern for 'Workbook' feel */
        .bg-grid-pattern {
            background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
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
                    <a href="#problem" class="text-slate-600 hover:text-teal-600 font-medium">Why This Workbook?</a>
                    <a href="#features" class="text-slate-600 hover:text-teal-600 font-medium">Inside Look</a>
                    <a href="#author" class="text-slate-600 hover:text-teal-600 font-medium">Author</a>
                    <a href="#pricing" class="bg-teal-700 text-white px-6 py-2 rounded-full font-bold hover:bg-teal-800 transition shadow-lg transform hover:-translate-y-0.5">Start Practicing</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-32 pb-20 overflow-hidden bg-white">
        <!-- Background Elements -->
        <div class="absolute right-0 top-0 w-1/2 h-full bg-teal-50 skew-x-12 transform origin-top-right z-0"></div>
        <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                
                <!-- Hero Copy -->
                <div class="text-center lg:text-left mb-12 lg:mb-0">
                    <div class="inline-flex items-center px-4 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-orange-200">
                        <i class="fas fa-pen-alt mr-2"></i> Interactive Workbook Edition
                    </div>
                    <h1 class="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 text-slate-900">
                        Don't Just Read About Assessment.<br>
                        <span class="text-teal-600">Practice It.</span>
                    </h1>
                    <p class="text-lg text-slate-600 mb-8 font-serif leading-relaxed">
                        The "Write-In" Clinical Companion for PMHNP Students and New Grads. Master your interviewing scripts, perfect your SOAP notes, and spot <span class="bg-yellow-100 px-1 font-bold text-slate-800">Preceptor Red Flags</span> before they happen.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <a href="#pricing" class="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-xl flex items-center justify-center">
                            Get Your Copy <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                        <div class="flex items-center justify-center sm:justify-start gap-2 px-4 py-2">
                            <div class="flex -space-x-2">
                                <div class="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                                <div class="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                                <div class="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
                            </div>
                            <span class="text-sm font-semibold text-slate-500">Trusted by 1000+ Students</span>
                        </div>
                    </div>
                </div>

                <!-- 3D Workbook Cover -->
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

    <!-- Problem Section: The Fear -->
    <section id="problem" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold text-slate-900 mb-6">The "Textbook Gap" is Real.</h2>
            <p class="text-xl text-slate-600 mb-12">
                You’ve memorized the pharmacology. You’ve passed the exams. But when you walk into the exam room, do you freeze?
            </p>
            
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

    <!-- Solution: Inside Look -->
    <section id="features" class="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16">
                <h2 class="text-3xl font-bold text-white">More Than a Book. It's a Clinical Toolkit.</h2>
                <p class="text-slate-400 mt-4">Volume 1 is designed to be written in, highlighted, and used on the job.</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Feature 1 -->
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 transition group">
                    <div class="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center text-teal-400 text-xl mb-4 group-hover:scale-110 transition">
                        <i class="fas fa-quote-right"></i>
                    </div>
                    <h3 class="font-bold text-lg mb-2">Phrase Banks</h3>
                    <p class="text-sm text-slate-400">Never stumble over your words. Exact scripts for trauma, substance use, and redirecting chatty patients.</p>
                    <span class="text-xs text-teal-500 font-bold mt-4 block uppercase tracking-wider">Chapter 20</span>
                </div>

                <!-- Feature 2 -->
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 transition group">
                    <div class="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center text-teal-400 text-xl mb-4 group-hover:scale-110 transition">
                        <i class="fas fa-flag"></i>
                    </div>
                    <h3 class="font-bold text-lg mb-2">Preceptor Red Flags</h3>
                    <p class="text-sm text-slate-400">A dedicated guide to the common mistakes preceptors hate (and how to avoid them).</p>
                    <span class="text-xs text-teal-500 font-bold mt-4 block uppercase tracking-wider">Chapter 19</span>
                </div>

                <!-- Feature 3 -->
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 transition group">
                    <div class="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center text-teal-400 text-xl mb-4 group-hover:scale-110 transition">
                        <i class="fas fa-pen-fancy"></i>
                    </div>
                    <h3 class="font-bold text-lg mb-2">SOAP Templates</h3>
                    <p class="text-sm text-slate-400">Fill-in-the-blank frameworks for HPI, MSE, and Assessment sections. Just copy and paste into your brain.</p>
                    <span class="text-xs text-teal-500 font-bold mt-4 block uppercase tracking-wider">Chapter 10</span>
                </div>

                <!-- Feature 4 -->
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 transition group">
                    <div class="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center text-teal-400 text-xl mb-4 group-hover:scale-110 transition">
                        <i class="fas fa-check-double"></i>
                    </div>
                    <h3 class="font-bold text-lg mb-2">Capstone Toolkit</h3>
                    <p class="text-sm text-slate-400">The "One-Page Workflow" and self-checklists to ensure you never miss a critical safety question.</p>
                    <span class="text-xs text-teal-500 font-bold mt-4 block uppercase tracking-wider">Chapter 20</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Author Section -->
    <section id="author" class="py-20 bg-teal-50">
        <div class="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div class="md:w-1/3">
                <div class="bg-white p-4 rounded-2xl shadow-xl transform rotate-3">
                    <div class="aspect-w-3 aspect-h-4 bg-gray-200 rounded-lg overflow-hidden relative">
                         <div class="absolute inset-0 flex items-center justify-center text-gray-400">
                             <i class="fas fa-user-nurse text-6xl"></i>
                         </div>
                    </div>
                    <p class="text-center font-serif italic text-slate-600 mt-4">"Plain English. Zero Fluff."</p>
                </div>
            </div>
            <div class="md:w-2/3">
                <h2 class="text-3xl font-bold text-teal-900 mb-4">Meet Tonia Ojomo, PMHNP</h2>
                <h3 class="text-lg font-semibold text-teal-600 mb-6">Your Clinical Mentor</h3>
                <p class="text-slate-700 mb-4">
                    Tonia wrote this book for one reason: <strong>To be the resource she wished she had as a student.</strong>
                </p>
                <p class="text-slate-700 mb-6">
                    She understands that academic language is great for exams, but real life is messy. That’s why Volume 1 is written in <strong>plain, ESL-friendly English</strong> with a focus on practical application. No dense paragraphs—just scripts, checklists, and confidence.
                </p>
                <div class="flex gap-4">
                    <span class="px-4 py-2 bg-white rounded-lg shadow-sm font-bold text-sm text-teal-800"><i class="fas fa-star text-yellow-400 mr-2"></i> Clinical Educator</span>
                    <span class="px-4 py-2 bg-white rounded-lg shadow-sm font-bold text-sm text-teal-800"><i class="fas fa-heart text-red-400 mr-2"></i> Student Advocate</span>
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
                <!-- Paperback (Main Offer) -->
                <div class="border-2 border-teal-500 rounded-2xl p-8 bg-white shadow-2xl relative transform hover:-translate-y-2 transition duration-300">
                    <div class="absolute top-0 right-0 bg-yellow-400 text-teal-900 text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">Recommended</div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">The Physical Workbook</h3>
                    <p class="text-sm text-slate-500 mb-6">Paperback Edition (Shipped)</p>
                    
                    <div class="flex items-baseline mb-8">
                        <span class="text-5xl font-extrabold text-teal-700">$29.99</span>
                        <span class="ml-2 text-slate-400">USD</span>
                    </div>

                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm"><strong>Write-in Worksheets:</strong> Complete the exercises directly in the book.</span></li>
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm"><strong>Desk Reference:</strong> Perfect for keeping at your clinical station.</span></li>
                        <li class="flex items-start"><i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i> <span class="text-slate-700 text-sm"><strong>Prime Shipping:</strong> Fast delivery via Amazon.</span></li>
                    </ul>

                    <a href="#" class="block w-full bg-teal-600 text-white font-bold text-center py-4 rounded-xl hover:bg-teal-700 transition shadow-lg">Buy on Amazon</a>
                </div>

                <!-- Digital (Secondary Offer) -->
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
                        <li class="flex items-start"><i class="fas fa-check text-slate-400 mt-1 mr-3"></i> <span class="text-slate-700 text-sm">Access to Printable Worksheets</span></li>
                    </ul>

                    <a href="#" class="block w-full bg-white border-2 border-slate-300 text-slate-700 font-bold text-center py-4 rounded-xl hover:bg-slate-100 transition">Download eBook</a>
                </div>
            </div>

            <!-- Lead Magnet: The Downsell -->
            <div class="mt-20 bg-teal-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                <div class="relative z-10 max-w-2xl mx-auto">
                    <h3 class="text-2xl font-bold mb-4">Not Ready to Buy?</h3>
                    <p class="text-teal-200 mb-6">Get the <strong>"Ultimate MSE Cheat Sheet"</strong> and our <strong>One-Page Workflow</strong> for free. Just enter your email.</p>
                    
                    <form class="flex flex-col sm:flex-row gap-3">
                        <input type="email" placeholder="Enter your best email..." class="flex-grow px-5 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-500">
                        <button class="bg-yellow-400 text-teal-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition">Send It to Me</button>
                    </form>
                    <p class="text-xs text-teal-400 mt-4"><i class="fas fa-lock mr-1"></i> Your email is safe. Unsubscribe anytime.</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800">
        <p>&copy; 2026 Tonia Ojomo. All Rights Reserved.</p>
    </footer>

</body>
</html>