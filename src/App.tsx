import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardConversations from "./pages/dashboard/DashboardConversations";
import DashboardSentiment from "./pages/dashboard/DashboardSentiment";
import DashboardReviews from "./pages/dashboard/DashboardReviews";
import DashboardAudit from "./pages/dashboard/DashboardAudit";
import DashboardDetection from "./pages/dashboard/DashboardDetection";
import DashboardAI from "./pages/dashboard/DashboardAI";
import DashboardAlerts from "./pages/dashboard/DashboardAlerts";
import Home from "./pages/Home";
import About from "./pages/About";
import MenuPage from "./pages/MenuPage";
import Reviews from "./pages/Reviews";
import ReadReviews from "./pages/ReadReviews";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/read-reviews" element={<ReadReviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pv-admin" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/pv-dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
            <Route path="/pv-dashboard/conversations" element={<ProtectedRoute><DashboardConversations /></ProtectedRoute>} />
            <Route path="/pv-dashboard/sentiment" element={<ProtectedRoute><DashboardSentiment /></ProtectedRoute>} />
            <Route path="/pv-dashboard/reviews" element={<ProtectedRoute><DashboardReviews /></ProtectedRoute>} />
            <Route path="/pv-dashboard/audit" element={<ProtectedRoute><DashboardAudit /></ProtectedRoute>} />
            <Route path="/pv-dashboard/detection" element={<ProtectedRoute><DashboardDetection /></ProtectedRoute>} />
            <Route path="/pv-dashboard/ai" element={<ProtectedRoute><DashboardAI /></ProtectedRoute>} />
            <Route path="/pv-dashboard/alerts" element={<ProtectedRoute><DashboardAlerts /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
