

// Voice to text utilities using Web Speech API

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
          onErrorCallback("Speech recognition access was denied. Please refresh the page and try again.");
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
          onErrorCallback("Speech recognition service is not available. Please try again later or use a different browser.");
          break;
        default:
          onErrorCallback(`Voice input error: ${event.error}. Please try again or refresh the page.`);
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
      onErrorCallback(`Failed to start voice input: ${error.message}. Please try refreshing the page.`);
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

