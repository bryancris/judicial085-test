
// Voice to text utilities using Web Speech API with improved permission handling

/**
 * Handles speech recognition using the browser's Web Speech API with proper permission management
 */
export const useSpeechRecognition = () => {
  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  // Request microphone permissions explicitly
  const requestMicrophonePermission = async (): Promise<{ granted: boolean; error?: string }> => {
    try {
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: "Microphone access is not available in this browser" };
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return { granted: true };
    } catch (error: any) {
      console.error("Microphone permission error:", error);
      
      if (error.name === 'NotAllowedError') {
        return { 
          granted: false, 
          error: "Microphone access was denied. Please click the microphone icon in your browser's address bar and allow access, then try again." 
        };
      } else if (error.name === 'NotFoundError') {
        return { 
          granted: false, 
          error: "No microphone found. Please connect a microphone and try again." 
        };
      } else if (error.name === 'NotSupportedError') {
        return { 
          granted: false, 
          error: "Microphone access is not supported in this browser. Try using Chrome or Edge." 
        };
      } else {
        return { 
          granted: false, 
          error: `Microphone access error: ${error.message}` 
        };
      }
    }
  };
  
  // Initialize the speech recognition API with permission check
  const startRecording = async (onResultCallback: (text: string) => void, onErrorCallback: (error: string) => void) => {
    if (!isSupported) {
      onErrorCallback("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return { stop: () => {} };
    }

    // Request microphone permission first
    console.log("Requesting microphone permission...");
    const permissionResult = await requestMicrophonePermission();
    
    if (!permissionResult.granted) {
      onErrorCallback(permissionResult.error || "Microphone permission denied");
      return { stop: () => {} };
    }

    console.log("Microphone permission granted, starting speech recognition...");

    // Use the appropriate speech recognition API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          onResultCallback(finalTranscript);
        } else {
          interimTranscript += transcript;
          // For real-time feedback you could call the callback with interim results
          onResultCallback(finalTranscript + interimTranscript);
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      
      if (event.error === 'not-allowed') {
        onErrorCallback("Microphone access was denied. Please refresh the page and allow microphone access when prompted.");
      } else if (event.error === 'no-speech') {
        onErrorCallback("No speech detected. Please speak clearly and try again.");
      } else if (event.error === 'audio-capture') {
        onErrorCallback("Microphone is not available. Please check your microphone connection.");
      } else if (event.error === 'network') {
        onErrorCallback("Network error occurred. Please check your internet connection.");
      } else {
        onErrorCallback(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Only call the callback with final transcript if something was recognized
      if (finalTranscript) {
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
