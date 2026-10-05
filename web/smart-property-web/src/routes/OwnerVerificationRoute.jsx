import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getRole } from "../utils/auth";
import { getOwnerVerificationStatus } from "../features/properties/services/ownerVerificationApi.js";
import { useAuth } from "../hooks/useAuth";

// Module-level cache: survives re-renders and navigation within a session.
// Stores { userId, data } so we can detect a user switch and invalidate.
// Cleared implicitly on hard refresh (module reloads). Cleared explicitly
// when the authenticated user changes (different owner logs in).
let verificationCache = null; // { userId: string, data: object } | null

/** Read the cached verification data for the current user, or null if not cached. */
export function getCachedVerification() {
  return verificationCache?.data ?? null;
}

export default function OwnerVerificationRoute() {
  const role = getRole();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // Determine whether the cache is valid for this user.
  // If the user ID has changed (different owner logged in), discard the stale cache.
  if (verificationCache !== null && verificationCache.userId !== currentUserId) {
    verificationCache = null;
  }

  const cachedData = verificationCache?.data ?? null;

  const [verification, setVerification] = useState(cachedData);
  const [checking, setChecking] = useState(cachedData === null);
  const fetchedRef = useRef(cachedData !== null);

  useEffect(() => {
    // Skip re-fetch if we already have a valid, user-scoped cached result.
    if (fetchedRef.current) return;

    if (role !== "PropertyOwner" || !currentUserId) {
      setChecking(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    getOwnerVerificationStatus({ signal: controller.signal })
      .then((status) => {
        if (active) {
          // Store with the current user's ID so a future user-switch invalidates it.
          verificationCache = { userId: currentUserId, data: status };
          fetchedRef.current = true;
          setVerification(status);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          fetchedRef.current = true;
          setChecking(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
    // Only re-run if the authenticated user changes (catches user-switch after SPA logout).
    // location.pathname is intentionally excluded — we fetch once per user, not per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, role]);

  // Non-owner roles (guard — should not normally reach here)
  if (role !== "PropertyOwner") {
    return <Outlet />;
  }

  // Still loading the first-time check — briefly shows nothing only on first page load
  if (checking) {
    return null;
  }

  // Not verified (or verification fetch failed) — redirect to verification page
  if (verification?.status !== "Verified") {
    return <Navigate to="/owner/verification" replace />;
  }

  // Verified — render child routes (OwnerLayout + page)
  return <Outlet />;
}
