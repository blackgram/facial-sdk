import type { LivenessMessages } from './types';

export const en: LivenessMessages = {
  instructionsTitle: 'Verify Your Identity',
  instructionsSubtitle:
    'For your security, we need to verify your identity with a quick selfie before you continue.',
  instructionsListHeader: 'Before you begin, please make sure to:',
  readyButton: 'BEGIN',

  tipLighting: 'Be in a well-lit area.',
  tipCenterFace: 'Position your face in the center of the frame.',
  tipObstructions: 'Remove any glasses, hats, or face coverings.',
  tipHoldSteady: "Hold your phone steady at eye level, about an arm's length away.",
  tipFollowPrompts: 'You will be asked to look straight, turn, smile, blink, or nod.',

  holdStill: 'Hold still for auto-capture',
  looksGood: 'Looks good — hold still',
  processing: 'Processing captured frames…',

  cameraPermissionRequired: 'Camera permission required',
  cameraPermissionDescription: 'Allow camera access to complete liveness capture.',
  allowCamera: 'Allow Camera',
  noCameraFound: 'No front camera found',
  captureFailed: 'Capture failed. Please try again.',

  noFace: "We can't see your face. Center yourself in the guide.",
  multiFace: 'Only one face should be visible.',
  tooDark: 'Too dark — move to a brighter spot.',
  tooSmall: 'Move a little closer.',
  notInOval: 'Align your face inside the circle.',
  poseMismatch: 'Follow the instruction above.',
  blinkRequired: 'Blink naturally.',
  smileRequired: 'Give a clear, natural smile.',
  nodRequired: 'Nod your head gently.',
  antiStatic: 'Hold the phone naturally — avoid a flat photo or screen.',

  cancel: 'Cancel',
  goBack: 'Go Back',
  retry: 'Try Again',
};
