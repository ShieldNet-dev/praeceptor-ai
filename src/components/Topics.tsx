import { Network, Code, Bug, Database, Fingerprint, Globe } from "lucide-react";

const topics = [
  {
    icon: Network,
    title: "Network Security",
    lessons: 24,
    level: "Beginner",
    color: "from-primary to-cyan-400",
  },
  {
    icon: Code,
    title: "Secure Coding",
    lessons: 32,
    level: "Intermediate",
    color: "from-green-400 to-emerald-500",
  },
  {
    icon: Bug,
    title: "Penetration Testing",
    lessons: 28,
    level: "Advanced",
    color: "from-orange-400 to-red-500",
  },
  {
    icon: Database,
    title: "Data Protection",
    lessons: 18,
    level: "Beginner",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: Fingerprint,
    title: "Identity & Access",
    lessons: 22,
    level: "Intermediate",
    color: "from-accent to-pink-500",
  },
  {
    icon: Globe,
    title: "Web Security",
    lessons: 36,
    level: "All Levels",
    color: "from-primary to-accent",
  },
];

const Topics = () => {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-mono text-primary bg-primary/10 rounded-full border border-primary/20">
            &lt;curriculum /&gt;
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore <span className="text-gradient">Security Topics</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From fundamentals to advanced techniques, our comprehensive curriculum covers every aspect of modern cybersecurity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => (
            <div
              key={topic.title}
              className="group relative p-6 rounded-xl glass cyber-border cursor-pointer hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br ${topic.color} text-primary-foreground`}>
                  <topic.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{topic.lessons}</span> lessons
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    topic.level === "Beginner" 
                      ? "bg-success/20 text-success" 
                      : topic.level === "Intermediate" 
                        ? "bg-yellow-500/20 text-yellow-400" 
                        : topic.level === "Advanced" 
                          ? "bg-destructive/20 text-destructive"
                          : "bg-primary/20 text-primary"
                  }`}>
                    {topic.level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Topics;
