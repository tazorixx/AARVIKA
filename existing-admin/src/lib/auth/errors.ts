import { FirebaseError } from "firebase/app";

export function describeAuthError(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait a little and try again.";
    case "auth/network-request-failed":
      return "We couldn't connect to Gift4U. Check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact Gift4U support.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled in the Firebase project.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    default:
      if (error instanceof Error && error.message.startsWith("Gift4U Firebase is not configured")) {
        return error.message;
      }
      return "Something went wrong. Please try again.";
  }
}

export function logAuthDebug(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.info("[Gift4U Auth]", ...args);
  }
}
