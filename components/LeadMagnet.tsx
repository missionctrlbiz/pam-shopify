
"use client";

export function LeadMagnet() {
    return (
        <div className="mt-20 bg-teal-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold mb-4 text-white">Not Ready to Buy?</h3>
                <p className="text-teal-100 mb-8 text-lg">
                    Get the <strong>"Ultimate MSE Cheat Sheet"</strong> and our{" "}
                    <strong>One-Page Workflow</strong> for free. Just enter your email.
                </p>

                <form className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="email"
                        placeholder="Enter your best email..."
                        className="flex-grow px-6 py-4 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500 shadow-md text-lg"
                    />
                    <button
                        type="button"
                        className="bg-yellow-400 text-teal-950 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition shadow-lg transform hover:-translate-y-1 text-lg whitespace-nowrap"
                    >
                        Send It to Me
                    </button>
                </form>
                <p className="text-sm text-teal-300 mt-6 flex justify-center items-center gap-2 opacity-80">
                    <span>🔒</span> Your email is safe. Unsubscribe anytime.
                </p>
            </div>
        </div>
    );
}
