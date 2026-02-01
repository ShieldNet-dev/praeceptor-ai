import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import AdminReviews from "./pages/AdminReviews";
import AdminSupport from "./pages/AdminSupport";
import Terms from "./pages/Terms";
import SecurityTopics from "./pages/SecurityTopics";
import Blog from "./pages/Blog";
import Career from "./pages/Career";
import Support from "./pages/Support";
import About from "./pages/About";
import Documentation from "./pages/Documentation";
import Lessons from "./pages/Lessons";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security-topics" element={<SecurityTopics />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/career" element={<Career />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/lessons" element={<Lessons />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
