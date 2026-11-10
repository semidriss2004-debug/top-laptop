// Firebase configuration and initialization
// Seamlessly operates in standalone offline/local mode if Firebase credentials are not provided

let isFirebaseConfigured = false;

export const checkFirebaseConfig = () => {
  return isFirebaseConfigured;
};

// Export fallback or real client as needed
export const getFirebaseStatus = () => {
  return {
    configured: isFirebaseConfigured,
    mode: isFirebaseConfigured ? 'cloud-firestore' : 'local-storage-sync'
  };
};
