import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Shield, 
  Target, 
  Users, 
  Lightbulb,
  Award,
  Heart,
  Code,
  GraduationCap
} from 'lucide-react';
import praeceptorLogoFull from '@/assets/praeceptor-logo-full.png';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Shield,
      title: "Ethical Security",
      description: "We teach cybersecurity responsibly, emphasizing ethical practices and legal boundaries."
    },
    {
      icon: Target,
      title: "Practical Skills",
      description: "Our curriculum focuses on real-world scenarios and hands-on experience."
    },
    {
      icon: Users,
      title: "Inclusive Learning",
      description: "Cybersecurity education for everyone, regardless of background or experience level."
    },
    {
      icon: Lightbulb,
      title: "Continuous Innovation",
      description: "We constantly update our content to reflect the evolving threat landscape."
    }
  ];

  const team = [
    {
      role: "AI Mentor",
      name: "Praeceptor",
      description: "Your reformed black-hat hacker turned ethical security expert"
    },
    {
      role: "Vision",
      name: "Democratizing Cybersecurity",
      description: "Making professional security education accessible to all"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
          <span className="text-lg font-bold text-foreground">About Us</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <img 
            src={praeceptorLogoFull} 
            alt="Praeceptor AI" 
            className="h-24 w-auto mx-auto mb-8"
          />
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Your <span className="text-gradient">Cybersecurity Mentor</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Praeceptor AI is an intelligent cybersecurity tutor designed to democratize security education and empower the next generation of security professionals.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="glass cyber-border mb-12">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  In today's digital world, cybersecurity skills are no longer optional—they're essential. Yet quality security education remains expensive and inaccessible to many. We're changing that.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Praeceptor AI combines advanced artificial intelligence with proven pedagogical methods to deliver personalized, effective cybersecurity education. Whether you're a complete beginner or preparing for advanced certifications, our AI tutor adapts to your level, pace, and learning style.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="glass cyber-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* What Makes Us Different */}
        <Card className="glass cyber-border mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">What Makes Us Different</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 rounded-xl bg-cyan-500/20 w-fit mx-auto mb-3">
                  <Code className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI adapts to your learning style and pace
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 rounded-xl bg-violet-500/20 w-fit mx-auto mb-3">
                  <Award className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-semibold mb-2">Industry-Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Curriculum aligned with real-world skills and certifications
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 rounded-xl bg-rose-500/20 w-fit mx-auto mb-3">
                  <Heart className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="font-semibold mb-2">Learner-First</h3>
                <p className="text-sm text-muted-foreground">
                  Designed with empathy for all skill levels
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ethical Commitment */}
        <Card className="glass cyber-border border-primary/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Ethical Commitment</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We take our responsibility seriously. Praeceptor AI is designed with strict ethical guidelines to ensure all security knowledge is used for defense, not offense.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    All simulations occur in isolated, sandboxed environments
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    We emphasize legal and ethical boundaries in every lesson
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Content is designed to build defenders, not attackers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    We promote responsible disclosure and ethical hacking practices
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of learners building their cybersecurity skills with Praeceptor AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/auth')} size="lg">
              Get Started Free
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')} size="lg">
              Contact Support
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
