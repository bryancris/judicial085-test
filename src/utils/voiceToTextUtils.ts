
// Voice to text utilities using Web Speech API with proper permission handling

/**
 * Check microphone permissions and request if needed
 */
const checkMicrophonePermissions = async (): Promise<boolean> => {
  try {
    // First check if the Permissions API is available
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Microphone permission status:', permission.state);
      
      if (permission.state === 'denied') {
        return false;
      }
      
      if (permission.state === 'granted') {
        // Even if granted, we should test actual access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          console.log('Permission granted but getUserMedia failed:', error);
          return false;
        }
      }
    }
    
    // For browsers without Permissions API or when state is 'prompt'
    // Try to get user media to trigger permission request
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.log('getUserMedia failed:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return false;
      }
      // For other errors (like NotFoundError), we'll let the speech recognition try
      return true;
    }
  } catch (error) {
    console.log('Permission check failed:', error);
    return false;
  }
};

/**
 * Handles speech recognition using the browser's Web Speech API
 */
export const useSpeechRecognition = () => {
  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  const startRecording = async (onResultCallback: (text: string) => void, onErrorCallback: (error: string) => void) => {
    if (!isSupported) {
      onErrorCallback("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return { stop: () => {} };
    }

    console.log("Checking microphone permissions...");
    
    // Check permissions before starting speech recognition
    const hasPermission = await checkMicrophonePermissions();
    if (!hasPermission) {
      onErrorCallback("Microphone access is required for voice input. Please allow microphone access in your browser settings and try again.");
      return { stop: () => {} };
    }

    console.log("Starting speech recognition...");

    // Use the appropriate speech recognition API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    let isAborted = false;
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          onResultCallback(finalTranscript);
        } else {
          interimTranscript += transcript;
          // For real-time feedback
          onResultCallback(finalTranscript + interimTranscript);
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      
      if (isAborted) {
        // Don't show error for intentional stops
        return;
      }
      
      switch (event.error) {
        case 'not-allowed':
          onErrorCallback("Microphone access was denied. Please click the microphone icon in your browser's address bar, allow access, and try again.");
          break;
        case 'no-speech':
          onErrorCallback("No speech detected. Please speak clearly and try again.");
          break;
        case 'audio-capture':
          onErrorCallback("Microphone is not available. Please check your microphone connection and try again.");
          break;
        case 'network':
          onErrorCallback("Network error occurred. Please check your internet connection and try again.");
          break;
        case 'aborted':
          console.log("Speech recognition was aborted");
          break;
        default:
          onErrorCallback(`Speech recognition error: ${event.error}. Please try again.`);
      }
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended");
      if (finalTranscript && !isAborted) {
        onResultCallback(finalTranscript);
      }
    };
    
    try {
      console.log("Starting speech recognition");
      recognition.start();
    } catch (error: any) {
      console.error("Error starting recognition:", error);
      onErrorCallback(`Failed to start speech recognition: ${error.message}`);
      return { stop: () => {} };
    }
    
    return {
      stop: () => {
        try {
          isAborted = true;
          recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  };

  return {
    isSupported,
    startRecording
  };
};
