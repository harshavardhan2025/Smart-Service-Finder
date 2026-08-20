// ── Centralized Google Authentication Utility ──────────────────────────────────
// Google Identity Services (GIS) Token Client
// Supports Google Login / Signup using OAuth access tokens.


// Google OAuth Client ID
export const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "849555982996-giolb22mkrfbg8c4ut0ohbv1ps9giv2o.apps.googleusercontent.com";


/**
 * Check if Google Identity Services SDK is loaded.
 */
export const isGoogleSdkLoaded = () => {
  return (
    typeof window !== "undefined" &&
    !!window.google?.accounts?.oauth2
  );
};


/**
 * Wait for Google Identity Services SDK to load.
 *
 * @param {number} maxWaitMs - Maximum time to wait
 * @returns {Promise<boolean>}
 */
const waitForGoogleSdk = (maxWaitMs = 5000) => {
  return new Promise((resolve) => {
    // Already loaded
    if (isGoogleSdkLoaded()) {
      resolve(true);
      return;
    }


    const interval = 200;
    let waited = 0;


    const timer = setInterval(() => {
      waited += interval;


      // SDK loaded
      if (isGoogleSdkLoaded()) {
        clearInterval(timer);
        resolve(true);
        return;
      }


      // Timeout
      if (waited >= maxWaitMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
};


/**
 * Launch Google OAuth popup using GIS Token Client.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess
 * @param {Function} options.onError
 */
const launchGooglePopup = ({ onSuccess, onError }) => {
  try {
    // Check browser
    if (typeof window === "undefined") {
      onError?.(
        "Google Sign-In is only available in the browser."
      );
      return;
    }


    // Check Google SDK
    if (!isGoogleSdkLoaded()) {
      onError?.(
        "Google Identity Services SDK is not loaded."
      );
      return;
    }


    // Check Client ID
    if (!GOOGLE_CLIENT_ID) {
      onError?.(
        "Google Client ID is missing."
      );
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
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
  console.info("⏳ Google SDK not ready yet, waiting up to 5s...");
  waitForGoogleSdk(5000).then((sdkLoaded) => {
    if (sdkLoaded) {
      console.info("✅ Google SDK loaded successfully, launching popup");
      launchGooglePopup({ onSuccess, onError });
    } else {
      onError?.("Google SDK could not be loaded. Please check your internet connection or ad-blocker.");
    }
  });
};
