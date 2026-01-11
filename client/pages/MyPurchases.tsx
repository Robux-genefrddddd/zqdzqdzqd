import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ShoppingCart, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBuyerOrders, type PaymentOrder } from "@/lib/paymentService";
import { getAsset, type Asset } from "@/lib/assetService";
import {
  downloadAssetFile,
  forceDownloadFile,
  type AssetFile,
} from "@/lib/fileService";
import { Loader } from "@/components/ui/loader";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { toast } from "sonner";

export default function MyPurchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, Asset>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const buyerOrders = await getBuyerOrders(user.uid);

        // Filter only completed orders
        const completedOrders = buyerOrders.filter(
          (order) => order.status === "completed"
        );

        setOrders(completedOrders);

        // Fetch asset details for each order
        const assets = new Map<string, Asset>();
        for (const order of completedOrders) {
          try {
            const asset = await getAsset(order.productId);
            if (asset) {
              assets.set(order.productId, asset);
            }
          } catch (err) {
            console.error(
              `Failed to fetch asset ${order.productId}:`,
              err
            );
          }
        }
        setAssetMap(assets);
      } catch (error) {
        console.error("Error fetching purchases:", error);
        toast.error("Failed to load your purchases");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user, navigate]);

  const handleDownload = (assetId: string) => {
    setSelectedAssetId(assetId);
    setShowPreview(true);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader text="Loading your purchases..." />;
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              My Purchases
            </h1>
            <p className="text-sm text-muted-foreground">
              Download your purchased assets anytime, anywhere
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="border border-border/20 rounded-lg p-16 text-center space-y-4 bg-secondary/10">
            <ShoppingCart size={48} className="mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">
              No purchases yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start exploring our marketplace and purchase assets to get lifetime
              access
            </p>
            <button
              onClick={() => navigate("/marketplace")}
              className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Purchase Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-secondary/20 border border-border/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Purchases
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orders.length}
                </p>
              </div>
              <div className="p-4 bg-secondary/20 border border-border/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${orders
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-secondary/20 border border-border/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Purchase Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {orders.length > 0
                    ? new Date(orders[0].createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Purchases List */}
            <div className="space-y-3">
              {orders.map((order) => {
                const asset = assetMap.get(order.productId);

                return (
                  <div
                    key={order.id}
                    className="border border-border/20 rounded-lg p-4 flex items-center gap-4 hover:border-border/50 transition-colors"
                  >
                    {/* Asset Preview */}
                    {asset && (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-20 h-20 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {order.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Purchased{" "}
                        {new Date(order.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        Order ID: {order.id}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          ${order.productPrice?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-xs text-green-400 font-medium">
                          ✓ Purchased
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(order.productId)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2 text-sm"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {selectedAssetId && (
        <FilePreviewModal
          assetId={selectedAssetId}
          assetName={
            assetMap.get(selectedAssetId)?.name || "Asset"
          }
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={async (selectedFiles) => {
            // Handle download
            const { forceDownloadFile, downloadAssetFile } =
              await import("@/lib/fileService");

            for (const fileData of selectedFiles) {
              try {
                const blob = await downloadAssetFile(
                  fileData.path,
                  fileData.name
                );
                forceDownloadFile(blob, fileData.name);
                await new Promise((resolve) =>
                  setTimeout(resolve, 500)
                );
              } catch (err: any) {
                toast.error(
                  err?.message ||
                  `Failed to download ${fileData.name}`
                );
              }
            }
            toast.success(
              `${selectedFiles.length} file(s) downloaded`
            );
            setShowPreview(false);
          }}
        />
      )}
    </div>
  );
}
