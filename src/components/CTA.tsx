import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-16 sm:py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/20" />
          <div className="absolute inset-0 glass" />
          
          {/* Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-16 text-center cyber-border rounded-2xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 rounded-full bg-primary/20 border border-primary/30">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Start for Free</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 px-2">
              Ready to Become a
              <br />
              <span className="text-gradient">Security Expert?</span>
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 px-2">
              Join thousands of students who are mastering cybersecurity with Praeceptor AI. 
              Your journey to becoming a security professional starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
              <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
                Schedule Demo
              </Button>
            </div>
            
            <p className="mt-5 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              No credit card required · Free tier available · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
