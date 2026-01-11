import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  Users,
  Mail,
  Shield,
  Search,
  Info as InfoIcon,
  FileUp,
  BarChart3,
  MessageSquare,
  Lock,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/RoleBadge";
import { useUnreadTicketCount } from "@/hooks/useNotifications";

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, userProfile, loading, unreadCount, user } =
    useAuth();
  const { count: unreadTickets } = useUnreadTicketCount(user?.uid);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Disable body scroll when menu is open
  if (typeof window !== "undefined") {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-background/98 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={toggleMenu}
              className="p-1.5 hover:bg-white/8 rounded-lg transition-all duration-200 flex-shrink-0 group"
            >
              {menuOpen ? (
                <X
                  size={18}
                  className="text-foreground group-hover:text-primary transition-colors"
                />
              ) : (
                <Menu
                  size={18}
                  className="text-foreground group-hover:text-primary transition-colors"
                />
              )}
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                alt="Roblox"
                className="h-5 object-contain"
              />
              <span className="font-semibold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                RbxAssets
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isAuthenticated && userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
                    <img
                      src={
                        userProfile.profileImage ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                          userProfile.username
                      }
                      alt={userProfile.username}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                    />
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                      {userProfile.username}
                    </span>
                    <RoleBadge role={userProfile.role} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-4 py-2 border-b border-border/20">
                    <p className="text-sm font-semibold text-foreground">
                      {userProfile.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userProfile.email}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/upload" className="cursor-pointer">
                      Upload Asset
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/groups" className="cursor-pointer">
                      <Users size={16} className="mr-2" />
                      Groups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/messages"
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2" />
                        Messages
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/support"
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <MessageSquare size={16} className="mr-2" />
                        Support Tickets
                      </div>
                      {unreadTickets > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadTickets > 9 ? "9+" : unreadTickets}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {(userProfile.role === "founder" ||
                    userProfile.role === "admin" ||
                    userProfile.role === "support") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="cursor-pointer text-amber-400"
                        >
                          <Shield size={16} className="mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 focus:bg-red-500/20"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="text-xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-[9998]"
                onClick={closeMenu}
              />
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed left-0 top-0 bottom-0 w-56 bg-background border-r border-border/10 overflow-y-auto z-[9999]"
              >
                <div className="flex flex-col h-full">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="px-4 py-4 border-b border-border/10"
                  >
                    <h2 className="text-sm font-semibold uppercase tracking-tight text-muted-foreground">
                      Navigation
                    </h2>
                  </motion.div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="px-3 py-3">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mb-2"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight px-2">
                          Explore
                        </p>
                      </motion.div>
                      <div className="space-y-0.5">
                        <motion.div
                          custom={0}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/marketplace"
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                            onClick={closeMenu}
                          >
                            <Search
                              size={16}
                              className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                            />
                            <span className="font-medium">Marketplace</span>
                          </Link>
                        </motion.div>
                        <motion.div
                          custom={1}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/support"
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                            onClick={closeMenu}
                          >
                            <Mail
                              size={16}
                              className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                            />
                            <span className="font-medium flex-1">Support</span>
                            {unreadTickets > 0 && (
                              <span className="bg-destructive text-destructive-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {unreadTickets > 9 ? "9+" : unreadTickets}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                        <motion.div
                          custom={2}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/about"
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                            onClick={closeMenu}
                          >
                            <InfoIcon
                              size={16}
                              className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                            />
                            <span className="font-medium">About</span>
                          </Link>
                        </motion.div>
                      </div>
                    </div>

                    {isAuthenticated && userProfile ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          className="px-3 py-3 border-t border-border/10"
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight px-2 mb-2">
                            Account
                          </p>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="flex items-center gap-2 px-2 py-2 mb-2"
                          >
                            <img
                              src={
                                userProfile.profileImage ||
                                "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                                  userProfile.username
                              }
                              alt={userProfile.username}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {userProfile.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {userProfile.email}
                              </p>
                            </div>
                          </motion.div>
                          <div className="space-y-0.5">
                            <motion.div
                              custom={3}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                                onClick={closeMenu}
                              >
                                <BarChart3
                                  size={16}
                                  className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                                />
                                <span className="font-medium">Dashboard</span>
                              </Link>
                            </motion.div>
                            <motion.div
                              custom={4}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/upload"
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                                onClick={closeMenu}
                              >
                                <FileUp
                                  size={16}
                                  className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                                />
                                <span className="font-medium">Upload</span>
                              </Link>
                            </motion.div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="px-3 py-3 border-t border-border/10"
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight px-2 mb-2">
                            Tools
                          </p>
                          <div className="space-y-0.5">
                            <motion.div
                              custom={5}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/groups"
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                                onClick={closeMenu}
                              >
                                <Users
                                  size={16}
                                  className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                                />
                                <span className="font-medium">Groups</span>
                              </Link>
                            </motion.div>
                            <motion.div
                              custom={6}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/messages"
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                                onClick={closeMenu}
                              >
                                <MessageSquare
                                  size={16}
                                  className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                                />
                                <span className="font-medium flex-1">
                                  Messages
                                </span>
                                {unreadCount > 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-center flex-shrink-0"
                                  >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </motion.span>
                                )}
                              </Link>
                            </motion.div>
                          </div>
                        </motion.div>

                        {(userProfile.role === "founder" ||
                          userProfile.role === "admin" ||
                          userProfile.role === "support") && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="px-3 py-3 border-t border-border/10"
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight px-2 mb-2">
                              {userProfile.role === "support"
                                ? "Support"
                                : "Admin"}
                            </p>
                            <motion.div
                              custom={7}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/admin"
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-accent hover:text-accent/80 hover:bg-white/5 transition-colors duration-150 group"
                                onClick={closeMenu}
                              >
                                <Shield
                                  size={16}
                                  className="text-accent flex-shrink-0"
                                />
                                <span className="font-medium">
                                  {userProfile.role === "support"
                                    ? "Support Panel"
                                    : "Admin"}
                                </span>
                              </Link>
                            </motion.div>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="px-3 py-3 border-t border-border/10"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight px-2 mb-2">
                          Account
                        </p>
                        <div className="space-y-0.5">
                          <motion.div
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            variants={menuItemVariants}
                          >
                            <Link
                              to="/login"
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                              onClick={closeMenu}
                            >
                              <Lock
                                size={16}
                                className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                              />
                              <span className="font-medium">Sign In</span>
                            </Link>
                          </motion.div>
                          <motion.div
                            custom={4}
                            initial="hidden"
                            animate="visible"
                            variants={menuItemVariants}
                          >
                            <Link
                              to="/register"
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:text-primary hover:bg-white/5 transition-colors duration-150 group"
                              onClick={closeMenu}
                            >
                              <Plus
                                size={16}
                                className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                              />
                              <span className="font-medium">Sign Up</span>
                            </Link>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {isAuthenticated && userProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="border-t border-border/10 px-3 py-3 mt-auto"
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMenu();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-150 group"
                      >
                        <LogOut
                          size={16}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="border-t border-border/10 px-3 py-3 flex justify-center"
                  >
                    <a
                      href="https://roblox.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-40 hover:opacity-70 transition-opacity"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                        alt="Roblox"
                        className="h-3.5 object-contain"
                      />
                    </a>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
