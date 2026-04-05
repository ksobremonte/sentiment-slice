import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pv-admin" replace />;
  }

  // Check OTP verification
  const otpVerified = sessionStorage.getItem("otp_verified");
  if (otpVerified !== user.id) {
    return <Navigate to="/pv-admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
