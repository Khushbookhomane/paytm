"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  BotMessageSquare,
  User,
  RotateCcw,
  Globe,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Megaphone,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  toolResults?: Record<string, any>;
  followUps?: string[];
  actionButton?: { label: string; url: string };
  timestamp: string;
}

interface CopilotApiResponse {
  reply: string;
  language: string;
  tools_used: string[];
  tool_results: Record<string, any>;
  follow_ups?: string[];
  action_button?: { label: string; url: string };
}

function CopilotChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<Language>("hi");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggested prompts
  const suggestedPrompts = [
    { text: "Aaj meri total sale kitni hui?", lang: "hi", icon: TrendingUp },
    { text: "Why are my sales decreasing?", lang: "en", icon: HelpCircle },
    { text: "Which products should I reorder?", lang: "en", icon: PackageCheck },
    { text: "How can I increase my monthly revenue?", lang: "en", icon: Sparkles },
    { text: "Mere business ke liye marketing strategy banao.", lang: "hi", icon: Megaphone },
    { text: "Which customers are not returning?", lang: "en", icon: User },
    { text: "Give me a weekly business performance report.", lang: "en", icon: Layers },
    { text: "आजची विक्री किती झाली आणि नफा किती?", lang: "mr", icon: TrendingUp },
  ];

  useEffect(() => {
    const savedLang = authStorage.getLanguage();
    setLang(savedLang);
    const m = authStorage.getMerchant();
    setMerchant(m);

    // Initial Welcome Message
    const storeName = m?.name || "Sharma General Store";
    const initialGreeting =
      savedLang === "hi"
        ? `नमस्ते ${storeName}! 🙏 मैं आपका Paytm VentureAI बिज़नेस पार्टनर हूँ। आज की बिक्री, स्टॉक की स्थिति, मुनाफ़ा या ग्राहकों के बारे में कुछ भी पूछें या माइक दबाकर बोलें।`
        : savedLang === "mr"
        ? `नमस्कार ${storeName}! 🙏 मी तुमचा Paytm VentureAI व्यवसाय सहाय्यक आहे. आजची विक्री, साठा किंवा ग्राहकांविषयी काहीही विचारा किंवा माईक दाबून बोला.`
        : `Hello ${storeName}! 🙏 I am your Paytm VentureAI Business Partner. Ask me anything about sales trends, low-stock reorders, customer retention, or profit margins in English, Hindi, or Marathi.`;

    setMessages([
      {
        id: "msg-welcome",
        role: "assistant",
        content: initialGreeting,
        followUps: [
          "Aaj meri total sale kitni hui?",
          "Which products should I reorder?",
          "Why are my sales decreasing?",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Setup Web Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = savedLang === "hi" ? "hi-IN" : savedLang === "mr" ? "mr-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            handleSend(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }

    // Check if query passed in URL parameter (e.g. from top bar search)
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setTimeout(() => handleSend(initialQuery), 300);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiRequest<CopilotApiResponse>("/copilot/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          language: lang,
        }),
      });

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        toolsUsed: res.tools_used,
        toolResults: res.tool_results,
        followUps: res.follow_ups,
        actionButton: res.action_button,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Read aloud via TTS if voiceEnabled
      if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(res.reply.replace(/[*#]/g, ""));
        utterance.lang = res.language === "hi" ? "hi-IN" : res.language === "mr" ? "mr-IN" : "en-IN";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I had trouble analyzing that business request. Please verify your connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear conversation history and start a fresh session?")) {
      const storeName = merchant?.name || "Sharma General Store";
      setMessages([
        {
          id: `msg-fresh-${Date.now()}`,
          role: "assistant",
          content: `New conversation started for **${storeName}**. How can I help you grow today?`,
          followUps: ["Aaj meri total sale kitni hui?", "Which products should I reorder?"],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <AppLayout activePageTitle="AI Business Copilot">
      <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* ============================================================ */}
        {/* COPILOT CHAT HEADER                                          */}
        {/* ============================================================ */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00BAF2] via-[#0099cc] to-[#002E6E] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                  VentureAI Copilot
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Data-Backed
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Understands Hindi, Marathi, Hinglish & English
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-semibold">
              <Globe className="w-3 h-3 text-[#00BAF2] mr-1" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="hi" className="dark:bg-slate-900">हिन्दी</option>
                <option value="en" className="dark:bg-slate-900">English</option>
                <option value="mr" className="dark:bg-slate-900">मराठी</option>
              </select>
            </div>

            {/* Voice Read Aloud Toggle */}
            <button
              onClick={() => {
                if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? "Mute Voice Responses" : "Enable Voice Read-Aloud"}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                voiceEnabled
                  ? "bg-sky-50 dark:bg-sky-950 text-[#00BAF2] border-sky-200 dark:border-sky-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset / New Chat */}
            <button
              onClick={handleClearHistory}
              title="Start New Conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MESSAGES SCROLL CONTAINER                                    */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00BAF2] to-[#002E6E] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <BotMessageSquare className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      isUser
                        ? "bg-[#002E6E] text-white rounded-tr-none font-medium"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-800"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Render verified tool call badge & Action Button */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Data verified from: {msg.toolsUsed.join(", ")}</span>
                        </div>
                      )}

                      {msg.actionButton && (
                        <Link
                          href={msg.actionButton.url}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00BAF2] hover:bg-[#0099cc] text-white text-[11px] font-bold shadow-sm transition active:scale-95"
                        >
                          <span>{msg.actionButton.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Render Suggested Follow-up Questions */}
                  {!isUser && msg.followUps && msg.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.followUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00BAF2] dark:hover:text-[#00BAF2] bg-white dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {(merchant?.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Thinking Animation */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00BAF2] to-[#002E6E] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Analyzing Paytm transactions & stock levels...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================ */}
        {/* SUGGESTED PROMPT PILLS                                       */}
        {/* ============================================================ */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00BAF2]" />
            Suggestions:
          </span>
          {suggestedPrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#00BAF2] dark:hover:text-[#00BAF2] bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap shrink-0 hover:border-[#00BAF2] transition flex items-center gap-1.5"
              >
                <Icon className="w-3 h-3 text-[#00BAF2]" />
                <span>{p.text}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* CHAT INPUT FORM & VOICE UI                                   */}
        {/* ============================================================ */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 lg:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1324] flex items-center gap-2"
        >
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition shadow-sm ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-[#00BAF2]"
            }`}
            title={isListening ? "Listening... click to stop" : "Click to speak in Hindi/Marathi/English"}
          >
            {isListening ? <Mic className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak now..."
                : "Ask anything (e.g. Aaj meri total sale kitni hui? / Reorder stock)..."
            }
            className="flex-1 bg-slate-100 dark:bg-slate-900 text-xs lg:text-sm text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00BAF2]/30 transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-bold transition shadow-sm shadow-sky-500/20 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Business Copilot...</div>}>
      <CopilotChatInner />
    </Suspense>
  );
}
