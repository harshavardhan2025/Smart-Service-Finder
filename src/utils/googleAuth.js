// ── Centralized Google Authentication Utility ──────────────────────────────────
// Uses Google Identity Services (GIS) Token Client for modern OAuth popup flow
// with seamless fallback to Google Account Selector (/google-auth)

export const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "849555982996-giolb22mkrfbg8c4ut0ohbv1ps9giv2o.apps.googleusercontent.com";

/**
 * Check if Google Identity Services SDK is loaded in the browser
 */
export const isGoogleSdkLoaded = () => {
  return typeof window !== "undefined" && !!window.google?.accounts?.oauth2;
};

/**
 * Trigger Google OAuth Sign-in / Sign-up Flow
 * @param {Object} options
 * @param {string} options.flow - "user_login" | "provider_login" | "signup"
 * @param {Object} [options.extraBody] - Extra signup data (role, profession, city, phone, name)
 * @param {Function} options.onSuccess - Callback on successful token receipt (accessToken) => Promise<void>
 * @param {Function} options.onError - Callback on error (errorMessage) => void
 * @param {Function} [options.onFallback] - Callback when falling back to mock Google Auth
 * @param {Function} [options.navigate] - react-router navigate function
 */
export const triggerGoogleAuth = ({
  flow = "user_login",
  extraBody = {},
  onSuccess,
  onError,
  onFallback,
  navigate,
}) => {
  // Store flow context in sessionStorage for state recovery
  sessionStorage.setItem("google_auth_flow", flow);
  if (extraBody && Object.keys(extraBody).length > 0) {
    sessionStorage.setItem("pending_google_signup", JSON.stringify(extraBody));
  } else {
    sessionStorage.removeItem("pending_google_signup");
  }

  const fallbackToMock = (reason) => {
    console.info("ℹ️ Using Google Auth Assistant:", reason);
    if (onFallback) {
      onFallback(reason);
    } else if (navigate) {
      navigate("/google-auth?redirect=true");
    } else {
      window.location.href = "/google-auth?redirect=true";
    }
  };

  // Check if GIS is available
  if (isGoogleSdkLoaded()) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            console.warn("⚠️ Google OAuth response error:", tokenResponse.error);
            if (tokenResponse.error === "popup_closed_by_user") {
              onError?.("Google Sign-In popup was closed before completing.");
              return;
            }
            if (
              tokenResponse.error === "access_denied" ||
              tokenResponse.error === "idpiframe_initialization_failed"
            ) {
              fallbackToMock("Google popup permission denied");
              return;
            }
            fallbackToMock(tokenResponse.error_description || tokenResponse.error);
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              await onSuccess?.(tokenResponse.access_token);
            } catch (err) {
              onError?.(err.message || "Failed to authenticate with backend.");
            }
          } else {
            fallbackToMock("No access token received from Google");
          }
        },
        error_callback: (err) => {
          console.warn("⚠️ Google GIS initialization error:", err);
          fallbackToMock(err?.message || "Google GIS error");
        },
      });

      client.requestAccessToken({ prompt: "select_account" });
      return;
    } catch (err) {
      console.warn("⚠️ Error initializing Google Token Client:", err.message);
      fallbackToMock(err.message);
      return;
    }
  }

  // If GIS SDK is not loaded yet or blocked, fallback
  fallbackToMock("Google SDK not initialized");
};
