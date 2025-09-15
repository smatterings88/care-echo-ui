import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import UserDashboard from "./pages/UserDashboard";
import Survey from "./pages/Survey";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import UserCheckin from "./pages/UserCheckin";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";
import MediaDemo from "./pages/MediaDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute requireAgency={true}>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/survey" element={
              <ProtectedRoute requireAgency={true}>
                <Survey />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="org_admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requiredRole="site_admin">
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/user-checkin" element={
              <ProtectedRoute requiredRole="org_admin">
                <UserCheckin />
              </ProtectedRoute>
            } />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/media-demo" element={<MediaDemo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
