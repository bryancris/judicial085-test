
/// <reference types="vite/client" />

// Add type definitions for Web Speech API
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

