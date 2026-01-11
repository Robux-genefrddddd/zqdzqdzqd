import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { WarningNotificationModal } from "@/components/WarningNotificationModal";
import { Loader } from "@/components/ui/loader";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import AssetDetail from "./pages/AssetDetail";
import MyPurchases from "./pages/MyPurchases";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Upload from "./pages/Upload";
import Collections from "./pages/Collections";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Legal from "./pages/Legal";
import AdminPanel from "./pages/AdminPanel";
import Support from "./pages/Support";
import SupportNewTicket from "./pages/SupportNewTicket";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import NotFound from "./pages/NotFound";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Messages from "./pages/Messages";
import BanNotice from "./pages/BanNotice";
import CreatorProfile from "./pages/CreatorProfile";
import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserActiveWarnings } from "@/lib/warningService";

const queryClient = new QueryClient();

// Guard component to check if user is banned
const BanGuard = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!loading && user) {
        const warnings = await getUserActiveWarnings(user.uid);
        const hasBan = warnings.some(
          (w) => w.type === "ban" || w.type === "suspension",
        );
        if (hasBan) {
          navigate("/banned");
        }
      }
    };

    checkBanStatus();
  }, [user, loading, navigate]);

  if (loading) {
    return <Loader text="Initializing" />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col">
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <WarningNotificationModal />
        <BrowserRouter>
          <Routes>
            {/* Ban Notice - no layout, fullscreen */}
            <Route path="/banned" element={<BanNotice />} />

            {/* Protected routes with ban guard */}
            <Route
              path="/"
              element={
                <BanGuard>
                  <Layout>
                    <Index />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/marketplace"
              element={
                <BanGuard>
                  <Layout>
                    <Marketplace />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/asset/:id"
              element={
                <BanGuard>
                  <Layout>
                    <AssetDetail />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/creator/:id"
              element={
                <BanGuard>
                  <Layout>
                    <CreatorProfile />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/login"
              element={
                <Layout>
                  <Login />
                </Layout>
              }
            />
            <Route
              path="/register"
              element={
                <Layout>
                  <Register />
                </Layout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <BanGuard>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/about"
              element={
                <BanGuard>
                  <Layout>
                    <About />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/upload"
              element={
                <BanGuard>
                  <Layout>
                    <Upload />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/collections"
              element={
                <BanGuard>
                  <Layout>
                    <Collections />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/blog"
              element={
                <BanGuard>
                  <Layout>
                    <Blog />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/contact"
              element={
                <BanGuard>
                  <Layout>
                    <Contact />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/privacy"
              element={
                <BanGuard>
                  <Layout>
                    <Privacy />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/terms"
              element={
                <BanGuard>
                  <Layout>
                    <Terms />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/cookies"
              element={
                <BanGuard>
                  <Layout>
                    <Cookies />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/legal"
              element={
                <BanGuard>
                  <Layout>
                    <Legal />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <BanGuard>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/support"
              element={
                <BanGuard>
                  <Layout>
                    <Support />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/support/new"
              element={
                <BanGuard>
                  <Layout>
                    <SupportNewTicket />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/support/ticket/:ticketId"
              element={
                <BanGuard>
                  <Layout>
                    <SupportTicketDetail />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/groups"
              element={
                <BanGuard>
                  <Layout>
                    <Groups />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <BanGuard>
                  <Layout>
                    <GroupDetail />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/messages"
              element={
                <BanGuard>
                  <Layout>
                    <Messages />
                  </Layout>
                </BanGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
