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
            bg: "bg-[#041f50]",
            hover: "hover:bg-[#052647]",
            border: "border-[#041f50]",
            text: "text-[#041f50]",
            msgBg: "bg-blue-50 dark:bg-slate-800",
            msgBorder: "border-l-[#041f50]",
            userBg: "bg-[#041f50] text-white"
        },
        blue: {
            bg: "bg-[#041f50]",
            hover: "hover:bg-[#052647]",
            border: "border-[#041f50]",
            text: "text-[#041f50]",
            msgBg: "bg-blue-50 dark:bg-slate-800",
            msgBorder: "border-l-[#041f50]",
            userBg: "bg-[#041f50] text-white"
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
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[85%] ${message.role === "user"
                                                ? `${colorScheme.userBg} rounded-2xl rounded-br-md shadow-md`
                                                : `${colorScheme.msgBg} border-l-4 ${colorScheme.msgBorder} rounded-lg shadow-sm`
                                            } p-5`}>
                                            {message.role === "assistant" && (
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-semibold uppercase tracking-wide ${colorScheme.text} dark:opacity-80`}>
                                                        AI Assistant
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(message.content)}
                                                        className="p-1 rounded hover:bg-white/50 dark:hover:bg-slate-900/50 transition"
                                                        title="Copy this message"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            <div
                                                className={`prose prose-base max-w-none ${message.role === "user"
                                                        ? "prose-invert"
                                                        : "prose-slate dark:prose-invert"
                                                    } prose-headings:font-bold prose-headings:mb-3 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-base prose-p:leading-relaxed prose-p:mb-3 prose-strong:font-bold prose-strong:text-[#041f50] dark:prose-strong:text-white prose-ul:my-2 prose-li:my-1 prose-li:text-base prose-code:text-sm prose-code:bg-slate-200 dark:prose-code:bg-slate-700 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono`}
                                                dangerouslySetInnerHTML={{
                                                    __html: message.role === "user"
                                                        ? `<p class="text-white">${message.content}</p>`
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
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce animate-bounce-1"></div>
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce animate-bounce-2"></div>
                                                    <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-bounce animate-bounce-3"></div>
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
                                <div className="mb-2">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Have questions about this result?
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Ask for clarification, examples, or deeper explanations
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask a follow-up question..."
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#041f50] dark:focus:border-[#052647] transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50 text-base"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isLoading}
                                        className={`px-6 py-3 ${colorScheme.bg} text-white rounded-xl font-semibold ${colorScheme.hover} transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md`}
                                    >
                                        <Send className="w-5 h-5" />
                                        <span className="hidden sm:inline">Ask</span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                                    💡 Tip: Press Enter to send • Shift+Enter for new line
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
