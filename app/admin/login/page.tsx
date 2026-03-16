"use client"

import { useState } from "react"
import { supabaseBrowser } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError(signInError.message)
            } else {
                router.push("/admin")
                router.refresh()
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-block"
                    >
                        <Image
                            src="/logo.webp"
                            alt="Logo"
                            width={200}
                            height={60}
                            className="h-16 w-auto object-contain mx-auto drop-shadow-sm"
                            priority
                        />
                    </motion.div>
                    <p className="text-[#041f50] opacity-60 font-bold text-xs mt-4 tracking-widest uppercase">
                        Admin Portal
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[#041f50] tracking-tight">Welcome back</h1>
                        <p className="text-slate-500 text-sm mt-1">Sign in to manage your platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl text-sm border bg-red-50 border-red-100 text-red-600 font-medium"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="admin-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#af5ce9] focus:ring-1 focus:ring-[#af5ce9]/50 transition bg-white"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="admin-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#af5ce9] focus:ring-1 focus:ring-[#af5ce9]/50 transition bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 text-white text-base font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            style={{
                                background: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
                                boxShadow: "0 8px 20px -4px rgba(175, 92, 233, 0.3)",
                            }}
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                "Sign In to Admin"
                            )}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-xs font-medium mt-8 tracking-wider uppercase">
                    Psychiatric Assessment Mastery &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    )
}
