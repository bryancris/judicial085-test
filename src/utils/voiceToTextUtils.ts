
// Voice to text utilities using Web Speech API with simplified permission handling

/**
 * Handles speech recognition using the browser's Web Speech API
 */
export const useSpeechRecognition = () => {
  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  // Initialize the speech recognition API directly without explicit permission check
  const startRecording = async (onResultCallback: (text: string) => void, onErrorCallback: (error: string) => void) => {
    if (!isSupported) {
      onErrorCallback("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return { stop: () => {} };
    }

    console.log("Starting speech recognition directly...");

    // Use the appropriate speech recognition API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    let retryCount = 0;
    const maxRetries = 2;
    
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
        onErrorCallback("Microphone access was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.");
      } else if (event.error === 'no-speech') {
        onErrorCallback("No speech detected. Please speak clearly and try again.");
      } else if (event.error === 'audio-capture') {
        onErrorCallback("Microphone is not available. Please check your microphone connection.");
      } else if (event.error === 'network') {
        onErrorCallback("Network error occurred. Please check your internet connection.");
      } else if (event.error === 'aborted') {
        console.log("Speech recognition was aborted");
        // Don't show error for intentional stops
      } else {
        // For other errors, try to retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying speech recognition (attempt ${retryCount}/${maxRetries})`);
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error("Error on retry:", error);
              onErrorCallback(`Speech recognition failed after ${maxRetries} attempts. Please try again.`);
            }
          }, 1000);
        } else {
          onErrorCallback(`Speech recognition error: ${event.error}. Please try again.`);
        }
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
