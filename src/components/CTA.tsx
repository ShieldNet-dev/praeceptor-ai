import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/20" />
          <div className="absolute inset-0 glass" />
          
          {/* Content */}
          <div className="relative z-10 p-8 md:p-16 text-center cyber-border rounded-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/20 border border-primary/30">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Start for Free</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Become a
              <br />
              <span className="text-gradient">Security Expert?</span>
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join thousands of students who are mastering cybersecurity with Praeceptor AI. 
              Your journey to becoming a security professional starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="xl">
                Schedule Demo
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required · Free tier available · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
