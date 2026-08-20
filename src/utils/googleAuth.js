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
    if (typeof window === "undefined") {
      onError?.("Google Sign-In is only available in the browser.");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      onError?.("Google Client ID is missing.");
      return;
    }

    // Manual OAuth2 Redirect (bypasses all popup/ITP blockers)
    const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    const redirectUri = window.location.origin + window.location.pathname;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "email profile openid",
      prompt: "select_account"
    });

    window.location.href = `${oauth2Endpoint}?${params.toString()}`;
  } catch (err) {
    console.warn("⚠️ Error initializing Google Redirect:", err.message);
    onError?.(err.message || "Could not initialize Google Authentication redirect.");
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
