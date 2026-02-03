import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sampleConversation = [
  {
    role: "assistant",
    content: "Welcome to Praeceptor AI. I'm here to help you master cybersecurity. What would you like to learn about today?",
  },
  {
    role: "user",
    content: "How do buffer overflow attacks work?",
  },
  {
    role: "assistant",
    content: "Great question! A buffer overflow occurs when a program writes more data to a buffer than it can hold. This excess data can overwrite adjacent memory, potentially allowing attackers to execute malicious code. Let me show you a practical example...",
  },
];

const ChatDemo = () => {
  const navigate = useNavigate();
  const [messages] = useState(sampleConversation);
  const [inputValue, setInputValue] = useState("");

  return (
    <section className="relative py-16 sm:py-24 px-4 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-64 sm:h-96 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 blur-3xl -translate-y-1/2" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="opacity-0 animate-fade-in-up order-2 lg:order-1" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 text-xs sm:text-sm font-mono text-primary bg-primary/10 rounded-full border border-primary/20">
              &lt;interactive /&gt;
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Learn by <span className="text-gradient">Conversation</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              Our AI tutor adapts to your learning style, answering questions in real-time 
              and providing personalized explanations for complex security concepts.
            </p>
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {[
                "Ask any cybersecurity question",
                "Get code examples and explanations",
                "Practice with guided scenarios",
                "Track your progress over time",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm sm:text-base text-foreground">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
              Try It Free
            </Button>
          </div>

          {/* Right - Chat interface */}
          <div className="opacity-0 animate-fade-in-up order-1 lg:order-2" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="glass rounded-2xl overflow-hidden cyber-border">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-secondary/50 border-b border-border">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Praeceptor AI</h4>
                  <p className="text-xs text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success inline-block" />
                    Online & Ready
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-accent/20 text-accent" 
                        : "bg-primary/20 text-primary"
                    }`}>
                      {message.role === "user" ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-xl ${
                      message.role === "user"
                        ? "bg-accent/10 text-foreground"
                        : "bg-secondary text-foreground"
                    }`}>
                      <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-border">
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about cybersecurity..."
                    className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button variant="default" size="icon" className="h-10 w-10 sm:h-12 sm:w-12">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemo;
