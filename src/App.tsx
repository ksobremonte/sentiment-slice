import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Home from "./pages/Home";

// Lazy-loaded routes
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const DashboardConversations = lazy(() => import("./pages/dashboard/DashboardConversations"));
const DashboardSentiment = lazy(() => import("./pages/dashboard/DashboardSentiment"));
const DashboardReviews = lazy(() => import("./pages/dashboard/DashboardReviews"));
const DashboardDetection = lazy(() => import("./pages/dashboard/DashboardDetection"));
const DashboardAI = lazy(() => import("./pages/dashboard/DashboardAI"));
const DashboardAlerts = lazy(() => import("./pages/dashboard/DashboardAlerts"));
const DashboardTrends = lazy(() => import("./pages/dashboard/DashboardTrends"));
const About = lazy(() => import("./pages/About"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ReadReviews = lazy(() => import("./pages/ReadReviews"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen" />}>
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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pv-dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
              <Route path="/pv-dashboard/conversations" element={<ProtectedRoute><DashboardConversations /></ProtectedRoute>} />
              <Route path="/pv-dashboard/sentiment" element={<ProtectedRoute><DashboardSentiment /></ProtectedRoute>} />
              <Route path="/pv-dashboard/reviews" element={<ProtectedRoute><DashboardReviews /></ProtectedRoute>} />
              <Route path="/pv-dashboard/detection" element={<ProtectedRoute><DashboardDetection /></ProtectedRoute>} />
              <Route path="/pv-dashboard/ai" element={<ProtectedRoute><DashboardAI /></ProtectedRoute>} />
              <Route path="/pv-dashboard/alerts" element={<ProtectedRoute><DashboardAlerts /></ProtectedRoute>} />
              <Route path="/pv-dashboard/trends" element={<ProtectedRoute><DashboardTrends /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
