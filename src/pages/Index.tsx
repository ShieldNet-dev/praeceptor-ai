import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatDemo from "@/components/ChatDemo";
import Topics from "@/components/Topics";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated (e.g., returning from OAuth), redirect to onboarding
    if (!loading && user) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ChatDemo />
        <Topics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
