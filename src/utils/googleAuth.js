// ── Centralized Google Authentication Utility ──────────────────────────────────
// Uses Google Identity Services (GIS) Token Client for modern real-time OAuth popup flow.

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
 * Wait for the Google Identity Services SDK to finish loading.
 * The SDK is loaded via <script async defer> so it may not be ready
 * when the user clicks "Sign In with Google". This polls every 200ms
 * for up to `maxWaitMs` before giving up.
 * @param {number} maxWaitMs - Maximum time to wait in milliseconds (default: 3000)
 * @returns {Promise<boolean>} - true if SDK loaded, false if timed out
 */
const waitForGoogleSdk = (maxWaitMs = 3000) => {
  return new Promise((resolve) => {
    if (isGoogleSdkLoaded()) {
      resolve(true);
      return;
    }
    const interval = 200;
    let waited = 0;
    const timer = setInterval(() => {
      waited += interval;
      if (isGoogleSdkLoaded()) {
        clearInterval(timer);
        resolve(true);
      } else if (waited >= maxWaitMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
};

/**
 * Launch the real Google OAuth popup using the GIS Token Client.
 */
const launchGooglePopup = ({ onSuccess, onError }) => {
  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      ux_mode: "redirect",
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          console.warn("⚠️ Google OAuth response error:", tokenResponse.error);
          if (tokenResponse.error === "popup_closed_by_user" || tokenResponse.error === "popup_closed") {
            onError?.("Google Sign-In popup was closed before completing.");
            return;
          }
          onError?.(tokenResponse.error_description || tokenResponse.error || "Google Sign-In failed.");
          return;
        }

        if (tokenResponse?.access_token) {
          try {
            await onSuccess?.(tokenResponse.access_token);
          } catch (err) {
            onError?.(err.message || "Failed to authenticate with backend.");
          }
        } else {
          onError?.("No access token received from Google.");
        }
      },
      error_callback: (err) => {
        console.warn("⚠️ Google GIS initialization error:", err);
        onError?.(err?.message || "Google Identity Services error. Please try again.");
      },
    });

    client.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    console.warn("⚠️ Error initializing Google Token Client:", err.message);
    onError?.(err.message || "Could not initialize Google Authentication popup.");
  }
};

/**
 * Trigger Real-time Google OAuth Sign-in / Sign-up Flow
 * @param {Object} options
 * @param {string} options.flow - "user_login" | "provider_login" | "signup"
 * @param {Object} [options.extraBody] - Extra signup data (role, profession, city, phone, name)
 * @param {Function} options.onSuccess - Callback on successful token receipt (accessToken) => Promise<void>
 * @param {Function} options.onError - Callback on error (errorMessage) => void
 * @param {Function} [options.navigate] - react-router navigate function
 */
export const triggerGoogleAuth = ({
  flow = "user_login",
  extraBody = {},
  onSuccess,
  onError,
}) => {
  // Store flow context in sessionStorage for state recovery
  sessionStorage.setItem("google_auth_flow", flow);
  if (extraBody && Object.keys(extraBody).length > 0) {
    sessionStorage.setItem("pending_google_signup", JSON.stringify(extraBody));
  } else {
    sessionStorage.removeItem("pending_google_signup");
  }

  // If SDK is already loaded, launch immediately
  if (isGoogleSdkLoaded()) {
    launchGooglePopup({ onSuccess, onError });
    return;
  }

  // SDK not ready yet — wait for it (async script may still be loading)
  console.info("⏳ Google SDK not ready yet, waiting up to 3s...");
  waitForGoogleSdk(3000).then((sdkLoaded) => {
    if (sdkLoaded) {
      console.info("✅ Google SDK loaded successfully, launching popup");
      launchGooglePopup({ onSuccess, onError });
    } else {
      onError?.("Google SDK could not be loaded. Please check your internet connection or ad-blocker.");
    }
  });
};

