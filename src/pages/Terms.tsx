import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">Praeceptor AI</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <div className="glass rounded-2xl p-8 md:p-12 cyber-border">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Terms of <span className="text-gradient">Service</span>
          </h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Praeceptor AI, you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to abide by these terms, please do not 
                use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>
                Praeceptor AI is an AI-powered cybersecurity education platform designed to provide 
                tutoring, training, and mentorship in various cybersecurity domains. Our services include 
                but are not limited to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Interactive AI-guided learning sessions</li>
                <li>Cybersecurity topic education</li>
                <li>SIWES and academic project support</li>
                <li>Exam preparation assistance</li>
                <li>Career guidance and interview preparation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Responsibilities</h2>
              <p>As a user of Praeceptor AI, you agree to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use the platform for educational purposes only</li>
                <li>Not attempt to use knowledge gained for malicious or illegal activities</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Provide accurate information during registration</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Ethical Use Policy</h2>
              <p>
                Praeceptor AI teaches cybersecurity from both offensive and defensive perspectives for 
                educational purposes only. Users must:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Never apply techniques learned to unauthorized systems</li>
                <li>Practice only in designated sandbox environments</li>
                <li>Report any vulnerabilities discovered responsibly</li>
                <li>Adhere to all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
              <p>
                All content provided by Praeceptor AI, including but not limited to text, graphics, 
                logos, and software, is the property of Praeceptor AI and is protected by intellectual 
                property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
              <p>
                Praeceptor AI provides educational content "as is" without warranties of any kind. We 
                are not liable for any damages arising from the use or inability to use our services, 
                or from any information obtained through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Privacy</h2>
              <p>
                Your privacy is important to us. We collect and process personal data in accordance with 
                our Privacy Policy. By using Praeceptor AI, you consent to such processing and warrant 
                that all data provided is accurate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the platform 
                after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the service immediately, without 
                prior notice or liability, for any reason, including breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us through the support 
                channels available on our platform.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated: January 2026
            </p>
            <Button variant="hero" onClick={() => navigate('/auth')}>
              I Accept These Terms
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
