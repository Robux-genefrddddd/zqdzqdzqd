import { useState, useEffect, useRef } from "react";
import { X, ShoppingCart, Lock, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Asset } from "@/lib/assetService";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PurchaseCheckoutModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function PurchaseCheckoutModal({
  asset,
  isOpen,
  onClose,
  onSuccess,
}: PurchaseCheckoutModalProps) {
  const { user, userProfile } = useAuth();
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypalScriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      paypalScriptLoadedRef.current = false;
      return;
    }

    if (!user) {
      setError("Please sign in to make a purchase");
      setPaypalLoading(false);
      return;
    }

    const loadPayPalScript = async () => {
      try {
        setPaypalError(null);

        // Check if PayPal SDK is already loaded
        if (window.paypal && paypalScriptLoadedRef.current) {
          initializePayPal();
          return;
        }

        // Load PayPal SDK if not already loaded
        if (!window.paypal) {
          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`;
          script.async = true;
          script.onload = () => {
            paypalScriptLoadedRef.current = true;
            initializePayPal();
          };
          script.onerror = () => {
            setPaypalError("Failed to load PayPal SDK");
            setPaypalLoading(false);
          };
          document.body.appendChild(script);
        } else {
          paypalScriptLoadedRef.current = true;
          initializePayPal();
        }
      } catch (err) {
        setPaypalError("Failed to initialize PayPal");
        setPaypalLoading(false);
      }
    };

    loadPayPalScript();
  }, [isOpen, user]);

  const initializePayPal = async () => {
    if (!window.paypal || !paypalContainerRef.current) {
      setPaypalLoading(false);
      return;
    }

    try {
      // Clear previous buttons if any
      paypalContainerRef.current.innerHTML = "";

      window.paypal
        .Buttons({
          createOrder: async (data: any, actions: any) => {
            try {
              const response = await fetch(
                "/.netlify/functions/paypal-create-order",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    productId: asset.id,
                    productName: asset.name,
                    productPrice: asset.price || 0,
                    currency: "USD",
                    buyerEmail: userProfile?.email || user?.email || "",
                  }),
                },
              );

              if (!response.ok) {
                const errData = await response.json();
                throw new Error(
                  errData.message || "Failed to create PayPal order",
                );
              }

              const { orderId } = await response.json();
              return orderId;
            } catch (err: any) {
              toast.error(err?.message || "Failed to create order");
              throw err;
            }
          },

          onApprove: async (data: any, actions: any) => {
            try {
              setLoading(true);
              const response = await fetch(
                "/.netlify/functions/paypal-capture-order",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    paypalOrderId: data.orderID,
                    productId: asset.id,
                    productName: asset.name,
                    productPrice: asset.price || 0,
                    currency: "USD",
                    buyerId: user?.uid,
                    buyerEmail: userProfile?.email || user?.email || "",
                    creatorId: asset.authorId,
                    creatorName: asset.authorName,
                    creatorEmail: "",
                  }),
                },
              );

              if (!response.ok) {
                const errData = await response.json();
                throw new Error(
                  errData.message || "Failed to capture payment",
                );
              }

              const result = await response.json();
              toast.success("Payment successful! Processing download...");

              onSuccess(result.orderId);
              onClose();

              // Redirect to order page after a short delay
              setTimeout(() => {
                window.location.href = `/order/${result.orderId}`;
              }, 1000);
            } catch (err: any) {
              console.error("Payment error:", err);
              toast.error(err?.message || "Failed to process payment");
              setError(err?.message || "Payment processing failed");
            } finally {
              setLoading(false);
            }
          },

          onError: (err: any) => {
            console.error("PayPal error:", err);
            toast.error("Payment error. Please try again.");
            setPaypalError("Payment error occurred. Please try again.");
          },

          onCancel: (data: any) => {
            toast.info("Payment cancelled");
          },

          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
          },
        })
        .render(paypalContainerRef.current);

      setPaypalLoading(false);
    } catch (err: any) {
      console.error("PayPal initialization error:", err);
      setPaypalError(err?.message || "Failed to initialize PayPal");
      setPaypalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <ShoppingCart size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Complete Your Purchase
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error State */}
          {error && !paypalError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Asset Summary */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              You are purchasing
            </p>

            <div className="flex gap-4 p-4 bg-secondary/30 rounded-lg border border-border/30">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-20 h-20 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                  {asset.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {asset.category}
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-lg font-bold text-primary">
                    ${asset.price?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features/Benefits */}
          <div className="space-y-2 py-2 border-y border-border/20">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              What you'll get
            </p>
            <ul className="space-y-2">
              {[
                "Immediate access to all files",
                "Download files anytime",
                "Lifetime access to updates",
              ].map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                >
                  <Check size={14} className="text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Security Notice */}
          {!paypalError && !error && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock size={14} className="flex-shrink-0" />
              <span>Secure payment powered by PayPal</span>
            </div>
          )}

          {/* PayPal Buttons Container */}
          {paypalError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 mb-3">{paypalError}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-medium"
              >
                Reload Page
              </button>
            </div>
          ) : paypalLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">
                Loading payment options...
              </p>
            </div>
          ) : (
            <div ref={paypalContainerRef} className="w-full" />
          )}

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center">
            By proceeding, you agree to our payment terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
