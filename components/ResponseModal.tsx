"use client";

import { X, Copy, Download, Check, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { useState, useRef, useEffect } from "react";

interface Message {
    role: "assistant" | "user";
    content: string;
}

interface ResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialContent: string;
    accentColor?: "teal" | "blue";
    systemPrompt: string;
}

export function ResponseModal({
    isOpen,
    onClose,
    title,
    initialContent,
    accentColor = "teal",
    systemPrompt
}: ResponseModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: initialContent }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const colors = {
        teal: {
            bg: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600",
            hover: "hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700",
            buttonBg: "bg-emerald-600 hover:bg-emerald-700",
            border: "border-emerald-500",
            text: "text-emerald-700 dark:text-emerald-400",
            msgBg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
            msgBorder: "border-l-4 border-emerald-500 dark:border-emerald-400",
            userBg: "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700"
        },
        blue: {
            bg: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
            hover: "hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700",
            buttonBg: "bg-blue-600 hover:bg-blue-700",
            border: "border-blue-500",
            text: "text-blue-700 dark:text-blue-400",
            msgBg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40",
            msgBorder: "border-l-4 border-blue-500 dark:border-blue-400",
            userBg: "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700"
        },
    };

    const colorScheme = colors[accentColor];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleCopy = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleDownload = () => {
        const fullConversation = messages
            .map(m => `${m.role === "user" ? "You" : "AI Assistant"}: ${m.content}`)
            .join("\n\n");

        const blob = new Blob([fullConversation], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const conversationContext = messages
                .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
                .join("\n\n");

            const prompt = `${systemPrompt}

Previous conversation:
${conversationContext}

User's new question: ${userMessage}

Please provide a helpful, detailed response that builds on our previous conversation.`;

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get response");
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.text || "No response generated."
            }]);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Something went wrong";
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `❌ **Error:** ${errorMsg}\n\nPlease try again.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700"
                        >
                            {/* Header */}
                            <div className={`flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 ${colorScheme.bg}`}>
                                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                                    <Sparkles className="w-6 h-6" />
                                    <span>{title}</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDownload}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                        title="Download conversation"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[80%] ${message.role === "user"
                                                ? `${colorScheme.userBg} rounded-2xl rounded-br-md shadow-md border border-slate-200 dark:border-slate-600`
                                                : `${colorScheme.msgBg} ${colorScheme.msgBorder} rounded-xl shadow-lg`
                                            } p-5`}>
                                            {message.role === "assistant" && (
                                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/50 dark:border-emerald-800/30">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                                            <Sparkles className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className={`text-sm font-bold ${colorScheme.text}`}>
                                                            AI Clinical Assistant
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(message.content)}
                                                        className="p-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all"
                                                        title="Copy this message"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            {message.role === "user" && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                        <span>You</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className={`prose prose-base max-w-none ${message.role === "user"
                                                        ? "prose-slate dark:prose-invert"
                                                        : "prose-emerald dark:prose-invert"
                                                    } 
                                                    prose-headings:font-extrabold 
                                                    prose-headings:mb-4
                                                    prose-headings:mt-6
                                                    prose-h1:text-2xl 
                                                    prose-h2:text-xl 
                                                    prose-h3:text-lg
                                                    prose-p:text-slate-800 dark:prose-p:text-slate-200 
                                                    prose-p:leading-7
                                                    prose-p:mb-4
                                                    prose-strong:text-emerald-900 dark:prose-strong:text-emerald-200
                                                    prose-strong:font-bold
                                                    prose-li:text-slate-800 dark:prose-li:text-slate-200
                                                    prose-li:mb-2
                                                    prose-li:leading-7
                                                    prose-ul:my-4
                                                    prose-ol:my-4
                                                    prose-ul:space-y-2
                                                    prose-ol:space-y-2
                                                    prose-code:text-emerald-800 dark:prose-code:text-emerald-300
                                                    prose-code:bg-emerald-100 dark:prose-code:bg-emerald-900/30
                                                    prose-code:px-2
                                                    prose-code:py-1
                                                    prose-code:rounded-md
                                                    prose-code:font-mono
                                                    prose-code:text-sm
                                                    prose-pre:bg-slate-800
                                                    prose-pre:text-slate-100
                                                    prose-pre:rounded-lg
                                                    prose-pre:shadow-inner
                                                    `}
                                                dangerouslySetInnerHTML={{
                                                    __html: message.role === "user"
                                                        ? `<p class="mb-0">${message.content}</p>`
                                                        : marked.parse(message.content)
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className={`${colorScheme.msgBg} border-l-4 ${colorScheme.msgBorder} rounded-lg p-4 shadow-sm`}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                                <div className="mb-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Ask questions about the response above to learn more...</span>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="e.g., Can you explain this in simpler terms? or Why is this approach better?"
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 transition-all bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50 shadow-sm"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isLoading}
                                        className={`px-6 py-3.5 ${colorScheme.buttonBg} text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
                                    >
                                        <Send className="w-5 h-5" />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                                    💡 Tip: Press <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">Enter</kbd> to send • <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">Shift+Enter</kbd> for new line
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
