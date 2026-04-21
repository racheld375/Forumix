import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) return <Navigate to="/login" />;

  if (role && user?.role !== role)
    return <Navigate to="/" />;

  return children;
}