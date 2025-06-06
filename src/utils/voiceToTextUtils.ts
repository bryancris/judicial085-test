
// Voice to text utilities using Web Speech API with proper permission handling

/**
 * Request microphone permissions explicitly
 */
const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    console.log("Requesting microphone permission...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately as we only needed permission
    stream.getTracks().forEach(track => track.stop());
    console.log("Microphone permission granted");
    return true;
  } catch (error: any) {
    console.error("Microphone permission denied or unavailable:", error);
    return false;
  }
};

/**
 * Check if microphone permissions are available
 */
const checkMicrophonePermissions = async (): Promise<boolean> => {
  try {
    // Try to get permission state if available
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    }
    return true; // Assume available if we can't check
  } catch (error) {
    console.log('Permission check not available, will try direct access');
    return true;
  }
};

/**
 * Handles speech recognition using the browser's Web Speech API
 */
export const useSpeechRecognition = () => {
  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  const startRecording = async (
    onResultCallback: (text: string) => void, 
    onErrorCallback: (error: string) => void, 
    onStartCallback?: () => void
  ) => {
    if (!isSupported) {
      onErrorCallback("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return { stop: () => {} };
    }

    console.log("Starting speech recognition process...");

    // First, try to get microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      onErrorCallback("Microphone access is required for voice input. Please allow microphone access when prompted and try again.");
      return { stop: () => {} };
    }

    // Use the appropriate speech recognition API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    let isAborted = false;
    let hasStarted = false;
    
    recognition.onstart = () => {
      console.log("Speech recognition started successfully");
      hasStarted = true;
      if (onStartCallback) {
        onStartCallback();
      }
    };
    
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
      console.error("Speech recognition error:", event.error);
      
      if (isAborted) {
        // Don't show error for intentional stops
        return;
      }
      
      switch (event.error) {
        case 'not-allowed':
          if (!hasStarted) {
            onErrorCallback("Microphone access was denied. Please refresh the page and allow microphone access when prompted.");
          } else {
            onErrorCallback("Microphone access was revoked. Please refresh the page to use voice input again.");
          }
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
          console.log("Speech recognition was stopped");
          break;
        case 'service-not-allowed':
          onErrorCallback("Speech recognition service is not available. Please try again later.");
          break;
        default:
          onErrorCallback(`Voice input error: ${event.error}. Please try again.`);
      }
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended");
      if (finalTranscript && !isAborted) {
        onResultCallback(finalTranscript);
      }
    };
    
    try {
      console.log("Starting speech recognition...");
      recognition.start();
    } catch (error: any) {
      console.error("Error starting recognition:", error);
      onErrorCallback(`Failed to start voice input: ${error.message}. Please try again.`);
      return { stop: () => {} };
    }
    
    return {
      stop: () => {
        try {
          isAborted = true;
          recognition.stop();
          console.log("Speech recognition stopped by user");
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
