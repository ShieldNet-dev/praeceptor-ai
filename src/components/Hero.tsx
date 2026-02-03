import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8 sm:pb-12 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-[100px] sm:blur-[128px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-accent/20 rounded-full blur-[80px] sm:blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 rounded-full glass border border-primary/30 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">AI-Powered Cybersecurity Education</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight opacity-0 animate-fade-in-up px-2" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            Master Cybersecurity
            <br />
            <span className="text-gradient">with Your AI Tutor</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 opacity-0 animate-fade-in-up px-2" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            Praeceptor AI guides you through the complex world of cybersecurity with personalized lessons, 
            real-world scenarios, and adaptive learning paths.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 opacity-0 animate-fade-in-up px-4" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="lg" className="w-full sm:w-auto" onClick={() => scrollToSection('curriculum')}>
              <Shield className="w-5 h-5" />
              View Curriculum
            </Button>
          </div>

          {/* Terminal preview */}
          <div className="max-w-3xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="glass rounded-xl overflow-hidden cyber-border">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                </div>
                <span className="ml-4 text-sm font-mono text-muted-foreground">praeceptor-ai — session</span>
              </div>
              
              {/* Terminal content */}
              <div className="p-6 font-mono text-sm md:text-base text-left space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-success">➜</span>
                  <span className="text-primary">praeceptor</span>
                  <span className="text-muted-foreground">~</span>
                  <span className="text-foreground">explain sql injection attack vectors</span>
                </div>
                <div className="pl-6 text-muted-foreground leading-relaxed">
                  <span className="text-primary">Praeceptor AI:</span> SQL injection occurs when untrusted data is sent to an interpreter as part of a command. Let me walk you through the main attack vectors...
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-foreground/70">▌</span>
                  <span className="animate-pulse text-primary">analyzing threat patterns...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 sm:pt-16 border-t border-border/50 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            {[
              { value: "All", label: "Target Audience" },
              { value: "30+", label: "Security Topics" },
              { value: "98%", label: "Success Rate" },
              { value: "24/7", label: "AI Availability" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
