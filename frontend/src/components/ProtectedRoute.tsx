import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
