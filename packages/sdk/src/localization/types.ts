export interface LivenessMessages {
  // Instructions screen
  instructionsTitle: string;
  instructionsSubtitle: string;
  instructionsListHeader: string;
  readyButton: string;

  // Tips
  tipLighting: string;
  tipCenterFace: string;
  tipObstructions: string;
  tipHoldSteady: string;
  tipFollowPrompts: string;

  // Capture screen
  holdStill: string;
  looksGood: string;
  processing: string;

  // Errors
  cameraPermissionRequired: string;
  cameraPermissionDescription: string;
  allowCamera: string;
  noCameraFound: string;
  captureFailed: string;

  // Gate hints
  noFace: string;
  multiFace: string;
  tooDark: string;
  tooSmall: string;
  notInOval: string;
  poseMismatch: string;
  blinkRequired: string;
  smileRequired: string;
  nodRequired: string;
  antiStatic: string;

  // Actions
  cancel: string;
  goBack: string;
  retry: string;
}
