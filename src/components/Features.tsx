import { Shield, Brain, Lock, Terminal, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Threat Analysis",
    description: "Learn to identify and analyze security threats with real-world scenarios and hands-on exercises.",
  },
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Adaptive curriculum that adjusts to your skill level and learning pace for optimal progress.",
  },
  {
    icon: Lock,
    title: "Encryption Mastery",
    description: "Deep dive into cryptographic protocols, algorithms, and secure communication practices.",
  },
  {
    icon: Terminal,
    title: "Practical Labs",
    description: "Interactive sandbox environments to practice penetration testing and defensive techniques.",
  },
  {
    icon: Zap,
    title: "Real-Time Feedback",
    description: "Instant analysis of your code and security implementations with actionable insights.",
  },
  {
    icon: Users,
    title: "Community Access",
    description: "Connect with fellow security enthusiasts and experts in our moderated forums.",
  },
];

const Features = () => {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-mono text-primary bg-primary/10 rounded-full border border-primary/20">
            &lt;features /&gt;
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Path to <span className="text-gradient">Cyber Mastery</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Comprehensive training modules designed by industry experts to take you from beginner to security professional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl glass cyber-border hover:bg-card/80 transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
