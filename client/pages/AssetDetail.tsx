import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Star,
  Download,
  Heart,
  ArrowRight,
  Trash2,
  FileDown,
  Copy,
  MoreVertical,
  Lock,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAsset,
  incrementAssetDownloads,
  deleteAsset,
} from "@/lib/assetService";
import { getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { hasUserPurchased } from "@/lib/paymentService";
import {
  getAssetReviews,
  hasUserReviewedAsset,
  getUserReviewForAsset,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/lib/reviewService";
import {
  downloadAssetFile,
  forceDownloadFile,
  type AssetFile,
} from "@/lib/fileService";
import {
  isFavorited,
  addFavorite,
  removeFavorite,
} from "@/lib/favoritesService";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { PurchaseCheckoutModal } from "@/components/PurchaseCheckoutModal";
import { toast } from "sonner";
import type { Asset } from "@/lib/assetService";

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!id) return;

      try {
        // Fetch asset
        const assetData = await getAsset(id);
        if (!assetData) {
          setError("Asset not found");
          setLoading(false);
          return;
        }

        setAsset(assetData);

        // Fetch author profile
        const author = await getUserProfile(assetData.authorId);
        setAuthorProfile(author);

        // Fetch reviews
        const assetReviews = await getAssetReviews(id);
        setReviews(assetReviews);

        // Fetch user's review if authenticated
        if (user) {
          const existing = await getUserReviewForAsset(id, user.uid);
          setUserReview(existing);
          if (existing) {
            setRating(existing.rating);
            setReviewMessage(existing.message);
          }

          // Check if favorited
          const fav = await isFavorited(user.uid, id);
          setIsFav(fav);

          // Check if user has purchased the asset
          const purchased = await hasUserPurchased(user.uid, id);
          setHasPurchased(purchased);
        }
      } catch (err) {
        console.error("Error loading asset:", err);
        setError("Failed to load asset details");
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [id, user]);

  // Auto-open preview modal if preview=true in query params
  useEffect(() => {
    if (searchParams.get("preview") === "true") {
      setShowFilePreview(true);
    }
  }, [searchParams]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (!reviewMessage.trim()) {
      toast.error("Please write a review message");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    if (!id) return;

    setSubmittingReview(true);

    try {
      if (userReview) {
        // Update existing review
        await updateReview(userReview.id, rating, reviewMessage);
        toast.success("Review updated successfully");
        setUserReview({
          ...userReview,
          rating,
          message: reviewMessage,
          createdAt: new Date(),
        });
      } else {
        // Create new review
        await createReview(
          id,
          user.uid,
          userProfile.displayName,
          rating,
          reviewMessage,
        );
        toast.success("Review posted successfully");

        // Reload reviews
        const updatedReviews = await getAssetReviews(id);
        setReviews(updatedReviews);

        const newUserReview = await getUserReviewForAsset(id, user.uid);
        setUserReview(newUserReview);

        // Reload asset to get updated rating
        const updatedAsset = await getAsset(id);
        if (updatedAsset) {
          setAsset(updatedAsset);
        }
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      await deleteReview(userReview.id);
      toast.success("Review deleted");
      setUserReview(null);
      setReviewMessage("");
      setRating(5);

      if (id) {
        const updatedReviews = await getAssetReviews(id);
        setReviews(updatedReviews);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !asset) {
      toast.error("Please sign in to save assets");
      return;
    }

    try {
      if (isFav) {
        await removeFavorite(user.uid, asset.id);
        setIsFav(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(user.uid, asset.id, asset.name, asset.imageUrl);
        setIsFav(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to save asset");
    }
  };

  const handleDeleteAsset = async () => {
    if (!user || !asset) return;

    if (user.uid !== asset.authorId) {
      toast.error("You can only delete your own assets");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this asset? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingAsset(true);

    try {
      await deleteAsset(asset.id, user.uid);
      toast.success("Asset deleted successfully");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete asset",
      );
    } finally {
      setDeletingAsset(false);
    }
  };

  const handleDownloadAsset = () => {
    if (!asset) return;

    // Check if asset is paid and user hasn't purchased it
    const isPaidAsset = asset.price && asset.price > 0;
    const isAuthor = user && user.uid === asset.authorId;
    const canDownload = isAuthor || !isPaidAsset || hasPurchased;

    if (isPaidAsset && !isAuthor && !hasPurchased) {
      // Show purchase modal for paid assets not purchased
      if (!user) {
        toast.error("Please sign in to purchase this asset");
        navigate("/login");
        return;
      }
      setShowPurchaseModal(true);
    } else if (canDownload) {
      // Show file preview for free assets, author's own assets, or purchased assets
      setShowFilePreview(true);
    } else {
      toast.error("Unable to download asset");
    }
  };

  const handleDownloadSelectedFiles = async (selectedFiles: AssetFile[]) => {
    if (!asset || selectedFiles.length === 0) {
      toast.error("No files selected for download");
      return;
    }

    setDownloading(true);

    try {
      // Download each selected file
      for (const fileData of selectedFiles) {
        try {
          const fileName = fileData.name;
          // Pass both path and fileName to backend for proper naming
          const blob = await downloadAssetFile(fileData.path, fileName);
          forceDownloadFile(blob, fileName);

          // Small delay between downloads to allow browser to process
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          console.error(`Error downloading file ${fileData.name}:`, err);
          toast.error(errorMsg || `Failed to download file: ${fileData.name}`);
        }
      }

      // Increment download count once
      if (id) {
        await incrementAssetDownloads(id);
        setAsset((prev) =>
          prev ? { ...prev, downloads: prev.downloads + 1 } : null,
        );
      }

      toast.success(`${selectedFiles.length} file(s) download started`);
      setShowFilePreview(false);
    } catch (error) {
      console.error("Error downloading asset:", error);
      toast.error("Failed to download asset");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading asset..." />;
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">
            Asset Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "This asset doesn't exist"}
          </p>
          <Link to="/marketplace">
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2">
              Back to Marketplace
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const priceLabel =
    asset.price && asset.price > 0 ? `$${asset.price.toFixed(2)}` : "Free";

  const copyAssetLink = () => {
    const link = `${window.location.origin}/asset/${asset.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Asset link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Image & Metadata */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 mb-8">
          {/* Asset Image */}
          <div className="flex items-center justify-start lg:justify-center">
            <div className="relative rounded-xl overflow-hidden bg-muted border border-border/15 shadow-sm w-full max-w-2xl h-72 lg:h-96">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
              />

              {/* Top-right action menu */}
              <TooltipProvider>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {/* Price Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      asset.price && asset.price > 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    {priceLabel}
                  </span>

                  {/* 3-dot Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm border border-white/10">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleToggleFavorite}>
                        <Heart
                          size={14}
                          className="mr-2"
                          fill={isFav ? "currentColor" : "none"}
                        />
                        {isFav ? "Remove from Favorites" : "Add to Favorites"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyAssetLink}>
                        <Copy size={14} className="mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      {user && user.uid === asset.authorId && (
                        <>
                          <hr className="my-1" />
                          <DropdownMenuItem
                            onClick={handleDeleteAsset}
                            disabled={deletingAsset}
                            className="text-red-400 focus:text-red-400"
                          >
                            <Trash2 size={14} className="mr-2" />
                            {deletingAsset ? "Deleting..." : "Delete Asset"}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="flex flex-col gap-4">
            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl font-bold mb-2 leading-tight">
                {asset.name}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(asset.rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/20"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {asset.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({asset.reviews})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2 border-t border-border/20 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{asset.category}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Downloads</span>
                <div className="flex items-center gap-1.5">
                  <Download size={12} />
                  <span className="font-medium">{asset.downloads}</span>
                </div>
              </div>
            </div>

            {/* Primary Download Button */}
            <button
              onClick={handleDownloadAsset}
              disabled={downloading || loading}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-auto"
            >
              {asset.price &&
              asset.price > 0 &&
              user?.uid !== asset.authorId &&
              !hasPurchased ? (
                <>
                  <Lock size={14} />
                  Get Access (${asset.price})
                </>
              ) : (
                <>
                  <FileDown size={14} />
                  {downloading ? "Downloading..." : "Download"}
                </>
              )}
            </button>

            {/* Creator Preview */}
            {authorProfile && (
              <div className="pt-2 border-t border-border/20">
                <p className="text-xs text-muted-foreground mb-2">Creator</p>
                <div className="flex items-center gap-2">
                  <img
                    src={
                      authorProfile.profileImage ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile.username}`
                    }
                    alt={authorProfile.username}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {authorProfile.displayName}
                    </p>
                    {authorProfile.role && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {authorProfile.role}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/creator/${authorProfile.uid}`}
                    className="text-xs font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
            About
          </h2>
          <p className="text-sm text-foreground/85 leading-relaxed max-w-3xl">
            {asset.description}
          </p>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {asset.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Reviews & Ratings
              </h2>
              <p className="text-xs text-muted-foreground">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {asset.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/5.0</span>
              </div>
              <div className="flex gap-0.5 mt-1 justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={
                      star <= Math.round(asset.rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/20"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Review Form Section */}
          {user && (
            <div className="mb-8 p-4 bg-secondary/30 border border-border/30 rounded-lg space-y-4">
              {userReview ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Update Your Review
                    </p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={20}
                            className={`transition-colors ${
                              star <= (hoveredRating || rating)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Update your review..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50"
                    >
                      {submittingReview ? "Saving..." : "Update Review"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteReview}
                      className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-medium flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Share Your Experience
                    </p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={20}
                            className={`transition-colors ${
                              star <= (hoveredRating || rating)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Share your thoughts about this asset..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50"
                  >
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-3 max-w-3xl">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-border/30 rounded-lg p-4 space-y-3 hover:border-border/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= review.rating
                                  ? "fill-accent text-accent"
                                  : "text-muted-foreground/20"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {review.userName}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed">
                        {review.message}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {review.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !user && (
              <div className="text-center py-8 border border-border/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to review this asset!
                </p>
              </div>
            )
          )}
        </div>

        {/* Back to Marketplace */}
        <div className="pt-4 border-t border-border/20">
          <Link to="/marketplace">
            <button className="px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-2">
              ← Back to Marketplace
            </button>
          </Link>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        assetId={id || ""}
        assetName={asset.name}
        isOpen={showFilePreview}
        onClose={() => setShowFilePreview(false)}
        onDownload={handleDownloadSelectedFiles}
        isDownloading={downloading}
      />

      {/* Purchase Checkout Modal */}
      <PurchaseCheckoutModal
        asset={asset}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          // After successful purchase, mark as purchased and show file preview
          setHasPurchased(true);
          setTimeout(() => {
            setShowFilePreview(true);
          }, 500);
        }}
      />
    </div>
  );
}
