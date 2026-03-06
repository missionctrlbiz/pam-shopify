"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
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
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid email or password.")
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
        <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #ed415b, #af5ce9, transparent)" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm relative z-10"
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
                            className="h-16 w-auto object-contain mx-auto"
                            priority
                        />
                    </motion.div>
                    <p className="text-white/20 text-xs mt-4 tracking-widest uppercase">Admin Dashboard</p>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl p-7 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)" }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl text-xs border"
                                style={{ background: "rgba(237, 65, 91, 0.08)", borderColor: "rgba(237, 65, 91, 0.15)", color: "#ed415b" }}
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="admin-email" className="block text-xs font-medium text-white/30 mb-2 tracking-wide uppercase">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" size={16} />
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/15 focus:outline-none focus:border-white/20 transition"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="block text-xs font-medium text-white/30 mb-2 tracking-wide uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" size={16} />
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/15 focus:outline-none focus:border-white/20 transition"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                                background: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
                                boxShadow: "0 4px 24px rgba(175, 92, 233, 0.25)",
                            }}
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                "Sign In"
                            )}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-white/10 text-[10px] mt-8 tracking-wider">
                    PSYCHIATRIC ASSESSMENT MASTERY &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    )
}
