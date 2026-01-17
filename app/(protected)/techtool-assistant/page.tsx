"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import ChatSidebar from "@/components/ChatSidebar";

type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  buttons?: any;
};

function parseButtons(text: string) {
  const buttons: string[] = [];
  const cleaned = text.replace(/{{\s*button:\s*([^}]+)\s*}}/gi, (_, label: string) => {
    const value = label.trim();
    if (value) {
      buttons.push(value);
    }
    return "";
  });

  return { buttons, cleanedText: cleaned.replace(/\n{3,}/g, "\n\n").trim() };
}

function extractResponseText(response: unknown) {
  if (!response || typeof response !== "object") {
    return String(response ?? "");
  }

  const record = response as Record<string, unknown>;
  const candidate = record.output ?? record.text ?? record.message;
  if (typeof candidate === "string") {
    return candidate;
  }

  try {
    return JSON.stringify(record, null, 2);
  } catch {
    return "";
  }
}

// Inline SVGs for icons
const Icons = {
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  ),
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
};

export default function TechToolAssistantPage() {
  const chatUrl = process.env.NEXT_PUBLIC_N8N_CHAT_URL;
  const sessionState = authClient.useSession();
  const user = sessionState?.data?.user;
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const canSend = Boolean(chatUrl && user && inputValue.trim().length > 0);
  
  const userMetadata = useMemo(
    () => ({
      userId: user?.id,
      name: user?.name,
      email: user?.email,
    }),
    [user]
  );

  const saveMessageToDb = async (sessionId: string, sender: "user" | "bot", text: string, buttons?: string[]) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, sender, text, buttons }),
      });
    } catch (error) {
      console.error("Failed to persist message", error);
    }
  };

  const createNewSession = async (firstMessage: string) => {
    try {
      const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const session = await res.json();
        return session.id as string;
      }
    } catch (error) {
      console.error("Failed to create session", error);
    }
    return null;
  };

  const sendMessage = async (text: string) => {
    if (!chatUrl || !user) {
      return;
    }

    let sessionId = currentSessionId;
    
    // Auto-create session if none selected
    if (!sessionId) {
      sessionId = await createNewSession(text);
      if (!sessionId) return;
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    // Persist user message
    void saveMessageToDb(sessionId, "user", text);

    try {
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId,
          chatInput: text,
          metadata: userMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      const responseText = extractResponseText(data);
      const { buttons, cleanedText } = parseButtons(responseText);
      const displayText =
        cleanedText || (buttons.length > 0 ? "Choose an option:" : "No response received.");

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: displayText,
        buttons: buttons.length > 0 ? buttons : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Persist bot message
      void saveMessageToDb(sessionId, "bot", displayText, buttons.length > 0 ? buttons : undefined);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Error: Failed to reach the assistant.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      void saveMessageToDb(sessionId, "bot", errorMessage.text);
      console.error("Chat request failed", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    void sendMessage(inputValue.trim());
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  // Extract first name for greeting
  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  return (
    <div className="flex h-[calc(100vh-9rem)] bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-white/60 font-outfit">
      {/* Sidebar */}
      <ChatSidebar 
        currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} 
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto w-full mx-auto p-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {!chatUrl ? (
            <div className="mt-20 flex flex-col items-center text-center p-8 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <p className="text-gray-500">
                Missing <code>NEXT_PUBLIC_N8N_CHAT_URL</code> configuration.
              </p>
            </div>
          ) : messages.length === 0 && !isLoadingMessages ? (
            // Empty State / Greeting
            <div className="mt-12 md:mt-24 flex flex-col items-start px-4 md:px-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="mb-12 space-y-2">
                <h1 className="text-5xl md:text-6xl font-medium tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Hello, {firstName}
                  </span>
                </h1>
                <h2 className="text-4xl md:text-5xl text-[#c4c7c5] font-medium tracking-tight">
                  How can I help you today?
                </h2>
              </div>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icons.Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm text-gray-400">Loading conversation history...</p>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="space-y-8 pb-12 w-full max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Bot Avatar */}
                  {message.sender === "bot" && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-md border-2 border-white">
                       <img src="/wizard-bot.jpg" alt="Wizard Assistant" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className={`max-w-[85%] md:max-w-[75%] space-y-3 ${message.sender === "user" ? "ml-12" : ""}`}>
                    <div
                      className={`px-5 py-3.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        message.sender === "user"
                          ? "bg-[#f0f4f9] text-[#1f1f1f] rounded-3xl rounded-tr-sm"
                          : "text-gray-800 pt-2"
                      }`}
                    >
                      {message.text}
                    </div>

                    {/* Buttons (if any) */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.buttons.map((label: string) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => void sendMessage(label)}
                            disabled={isSending}
                            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-100 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isSending && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 animate-pulse shadow-md border-2 border-white/50">
                       <img src="/wizard-bot.jpg" alt="Wizard Assistant" className="w-full h-full object-cover grayscale opacity-50" />
                    </div>
                    <div className="pt-2 text-gray-500 animate-pulse font-medium">Wizard is thinking...</div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 w-full flex-shrink-0 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div 
              className={`flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 focus-within:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] focus-within:border-blue-100 transition-all duration-300 ${
                !chatUrl ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tell us what you need"
                className="flex-1 bg-transparent border-none outline-none text-gray-900 text-base placeholder-gray-500 h-full py-1 ml-2"
                disabled={isSending || !chatUrl || !user}
              />
              
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || isSending}
                className={`p-2 rounded-full transition-all duration-200 ${
                   inputValue.trim().length > 0 
                   ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                   : "bg-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icons.Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                TechTool Assistant can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
