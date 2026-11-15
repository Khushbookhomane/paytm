"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Database,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  timestamp: string;
}

interface CopilotResponse {
  reply: string;
  language: string;
  tools_used: string[];
  tool_results: Record<string, any>;
}

export default function CopilotPage() {
  const [lang, setLang] = useState<Language>("hi");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedLang = authStorage.getLanguage();
    setLang(savedLang);

    // Initial greeting message
    const initialGreeting =
      savedLang === "hi"
        ? "नमस्ते शर्मा जी! 🙏 मैं आपका Paytm VentureAI कोपायलट हूँ। आज की बिक्री, स्टॉक की स्थिति या ग्राहकों के बारे में कुछ भी पूछें या माइक दबाकर बोलें।"
        : savedLang === "mr"
        ? "नमस्कार शर्मा जी! 🙏 मी तुमचा Paytm VentureAI सहाय्यक आहे. आजची विक्री, साठा किंवा ग्राहकांविषयी काहीही विचारा किंवा माइक दाबून बोला."
        : "Hello Sharma Ji! 🙏 I am your Paytm VentureAI Copilot. Ask me anything about today's sales, stock levels, or customer offers using text or voice.";

    setMessages([
      {
        id: "init-1",
        role: "assistant",
        content: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Setup Web Speech API SpeechRecognition
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
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang =
        newLang === "hi" ? "hi-IN" : newLang === "mr" ? "mr-IN" : "en-IN";
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
    if (match) utterance.voice = match;

    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported on this browser.");
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
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiRequest<CopilotResponse>("/copilot/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, language: lang }),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply,
        toolsUsed: res.tools_used,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(res.reply);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "क्षमा करें, अनुरोध प्रोसेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें।",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const t = translations[lang];

  const quickPrompts = [
    { label: "आज की बिक्री कितनी हुई?", text: "आज की कुल बिक्री और मुनाफा कितना हुआ?" },
    { label: "What should I restock?", text: "What items are running low on stock and need restock?" },
    { label: "Which customers to message?", text: "Which regular customers have stopped visiting and need a message?" },
    { label: "दुकान का शुद्ध मुनाफा बताओ", text: "दुकान का शुद्ध मुनाफा और खर्चे का विवरण बताओ" },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between h-screen">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Sub-bar with Voice & Verification info */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <Database className="w-3.5 h-3.5 text-[#00BAF2]" />
          <span>{t.copilot.toolsBadge}</span>
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
            voiceEnabled
              ? "bg-[#E8F8FE] text-[#002E6E] border border-[#00BAF2]/30"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#00BAF2]" />
              <span>Voice ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Voice OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <main className="flex-1 p-4 space-y-3.5 overflow-y-auto no-scrollbar">
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-[#002E6E] text-white"
                    : "bg-[#00BAF2] text-white shadow-sm"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 space-y-1.5 ${
                  isUser
                    ? "bg-[#002E6E] text-white rounded-tr-none shadow-sm"
                    : "bg-white text-slate-900 border border-slate-200/80 rounded-tl-none shadow-sm"
                }`}
              >
                <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                  {m.content}
                </p>

                {/* Tool Badges */}
                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-100 flex flex-wrap gap-1">
                    {m.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5"
                      >
                        <span>✓</span>
                        <span>{tool}</span>
                      </span>
                    ))}
                  </div>
                )}

                <span
                  className={`block text-[9px] text-right font-medium ${
                    isUser ? "text-sky-200" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#00BAF2] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#002E6E] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-slate-500 font-bold ml-1">Analyzing store data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Suggested Quick Prompts Pills */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.text)}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-[#00BAF2] text-slate-700 text-[10px] font-bold shrink-0 active:scale-95 transition shadow-2xs"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Bar with Voice Mic */}
      <div className="bg-white border-t border-slate-200 p-3 flex items-center gap-2">
        {/* Large Mic Button */}
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition shadow-md active:scale-95 ${
            isListening
              ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-200"
              : "bg-[#00BAF2] hover:bg-[#00a3d4] text-white"
          }`}
          title={isListening ? "Listening... Tap to stop" : "Tap to Speak (en-IN, hi-IN, mr-IN)"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex-1 flex items-center gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? t.copilot.listening : t.copilot.placeholder}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-[#00BAF2] focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#002E6E] hover:bg-[#002252] disabled:opacity-40 text-white flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <Navigation currentLang={lang} />
    </div>
  );
}
