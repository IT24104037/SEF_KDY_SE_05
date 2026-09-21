import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRole, getToken } from "../utils/auth";
import { getOwnerVerificationStatus } from "../features/properties/services/ownerVerificationApi.js";

function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getRole();
  const location = useLocation();
  const [verification, setVerification] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [checkedPath, setCheckedPath] = useState(null);

  useEffect(() => {
    if (role !== "PropertyOwner" || location.pathname === "/owner/verification") {
      setCheckingVerification(false);
      setCheckedPath(location.pathname);
      return;
    }

    let active = true;
    setCheckingVerification(true);
    setVerification(null);
    setCheckedPath(null);
    getOwnerVerificationStatus()
      .then((status) => {
        if (active) {
          setVerification(status);
          setCheckingVerification(false);
          setCheckedPath(location.pathname);
        }
      })
      .catch(() => {
        if (active) {
          setCheckingVerification(false);
          setCheckedPath(location.pathname);
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname, role]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (checkingVerification) return null;

  if (
    role === "PropertyOwner" &&
    location.pathname !== "/owner/verification" &&
    checkedPath !== location.pathname
  ) {
    return null;
  }

  if (
    role === "PropertyOwner" &&
    location.pathname !== "/owner/verification" &&
    verification?.status !== "Verified"
  ) {
    return <Navigate to="/owner/verification" replace />;
  }

  return children;
}

export default ProtectedRoute;