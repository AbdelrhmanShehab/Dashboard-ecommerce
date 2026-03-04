export const getFirebaseError = (code) => {
    switch (code) {
        case "auth/email-already-in-use":
            return "This email is already in use by another account.";
        case "auth/invalid-email":
            return "The email address is not valid.";
        case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled.";
        case "auth/weak-password":
            return "The password is too weak. Please use at least 6 characters.";
        case "auth/user-disabled":
            return "This user account has been disabled.";
        case "auth/user-not-found":
            return "No user found with this email.";
        case "auth/wrong-password":
            return "Incorrect password.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
};
