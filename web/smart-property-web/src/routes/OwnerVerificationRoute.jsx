import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRole } from "../utils/auth";
import { getOwnerVerificationStatus } from "../features/properties/services/ownerVerificationApi.js";

export default function OwnerVerificationRoute() {
  const location = useLocation();
  const role = getRole();
  const [verification, setVerification] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [checkedPath, setCheckedPath] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    let active = true;

    if (role !== "PropertyOwner" || path === "/owner/verification") {
      setCheckingVerification(false);
      setVerification(null);
      setCheckedPath(path);
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();
    setCheckingVerification(true);
    setVerification(null);
    setCheckedPath(null);

    getOwnerVerificationStatus({ signal: controller.signal })
      .then((status) => {
        if (active) {
          setVerification(status);
          setCheckingVerification(false);
          setCheckedPath(path);
        }
      })
      .catch(() => {
        if (active) {
          setCheckingVerification(false);
          setCheckedPath(path);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [location.pathname, role]);

  if (role !== "PropertyOwner" || location.pathname === "/owner/verification") {
    return <Outlet />;
  }

  if (checkingVerification || checkedPath !== location.pathname) {
    return null;
  }

  if (verification?.status !== "Verified") {
    return <Navigate to="/owner/verification" replace />;
  }

  return <Outlet />;
}