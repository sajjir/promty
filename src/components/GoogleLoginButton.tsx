import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";

export default function GoogleLoginButton() {
  const { loginWithGoogle, googleClientId } = useAuth();

  // App only mounts GoogleOAuthProvider when this configuration exists.
  if (!googleClientId) return null;

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await loginWithGoogle(credentialResponse.credential);
    }
  };

  return (
    <div className="google-auth-btn-wrapper flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error("Google Login failed")}
        useOneTap
        shape="pill"
        text="signin_with"
        theme="outline"
      />
    </div>
  );
}
