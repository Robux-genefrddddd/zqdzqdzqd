import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

export interface Review {
  id: string;
  assetId: string;
  userId: string;
  userName: string;
  rating: number;
  message: string;
  createdAt: Date;
}

const REVIEWS_COLLECTION = "asset_reviews";
const ASSETS_COLLECTION = "assets";

/**
 * Calculate average rating and review count for an asset
 */
async function recalculateAssetRating(assetId: string): Promise<void> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.docs.length === 0) {
      // No reviews, set rating to 0
      await updateDoc(doc(db, ASSETS_COLLECTION, assetId), {
        rating: 0,
        reviews: 0,
      });
      return;
    }

    const reviews = querySnapshot.docs.map((doc) => doc.data());
    const averageRating =
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

    // Update asset with new rating and review count
    await updateDoc(doc(db, ASSETS_COLLECTION, assetId), {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviews: reviews.length,
    });
  } catch (error) {
    console.error("Error recalculating asset rating:", error);
  }
}

// Get all reviews for an asset
export async function getAssetReviews(assetId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);

    const reviews = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ) as Review[];

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Check if user has already reviewed this asset
export async function hasUserReviewedAsset(
  assetId: string,
  userId: string,
): Promise<boolean> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("assetId", "==", assetId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length > 0;
  } catch (error) {
    console.error("Error checking review:", error);
    return false;
  }
}

// Get user's review for an asset
export async function getUserReviewForAsset(
  assetId: string,
  userId: string,
): Promise<Review | null> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("assetId", "==", assetId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.docs.length === 0) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    } as Review;
  } catch (error) {
    console.error("Error fetching user review:", error);
    return null;
  }
}

// Create a new review
export async function createReview(
  assetId: string,
  userId: string,
  userName: string,
  rating: number,
  message: string,
): Promise<string> {
  try {
    // Check if user already has a review
    const existingReview = await getUserReviewForAsset(assetId, userId);
    if (existingReview) {
      throw new Error("You have already reviewed this asset");
    }

    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      assetId,
      userId,
      userName,
      rating,
      message,
      createdAt: Timestamp.now(),
    });

    // Recalculate asset rating
    await recalculateAssetRating(assetId);

    return docRef.id;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

// Update a review
export async function updateReview(
  reviewId: string,
  rating: number,
  message: string,
): Promise<void> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDocs(
      query(collection(db, REVIEWS_COLLECTION), where("__name__", "==", reviewId)),
    );

    let assetId = "";
    if (reviewSnap.docs.length > 0) {
      assetId = reviewSnap.docs[0].data().assetId;
    } else {
      // Fallback: get the review document directly
      const reviewDoc = await getDoc(reviewRef);
      if (reviewDoc.exists()) {
        assetId = reviewDoc.data().assetId;
      }
    }

    await updateDoc(reviewRef, {
      rating,
      message,
      createdAt: Timestamp.now(),
    });

    // Recalculate asset rating
    if (assetId) {
      await recalculateAssetRating(assetId);
    }
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}
