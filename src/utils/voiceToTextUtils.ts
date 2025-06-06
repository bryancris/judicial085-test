
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

    // Check for HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      onErrorCallback("Speech recognition requires a secure connection (HTTPS). Please access this site over HTTPS.");
      return { stop: () => {} };
    }

    console.log("Starting speech recognition process...");
    console.log("Protocol:", location.protocol);
    console.log("Hostname:", location.hostname);
    console.log("User Agent:", navigator.userAgent);

    const attemptRecognition = (retryCount = 0) => {
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
        console.log("Error event details:", event);
        console.log("Recognition state - hasStarted:", hasStarted, "isAborted:", isAborted);
        
        if (isAborted) {
          // Don't show error for intentional stops
          return;
        }
        
        switch (event.error) {
          case 'not-allowed':
            if (retryCount < 1) {
              console.log("Speech recognition denied, attempting retry...");
              setTimeout(() => {
                attemptRecognition(retryCount + 1);
              }, 1000);
              return;
            }
            onErrorCallback("Speech recognition is blocked by your browser. This can happen due to:\n\n• Browser security policies\n• Speech services not enabled\n• Ad blockers interfering\n\nTry:\n1. Refreshing the page\n2. Enabling speech services in browser settings\n3. Using Chrome or Edge\n4. Disabling ad blockers temporarily");
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
            onErrorCallback("Speech recognition service is not available. This may be due to browser policies or service limitations. Try using Chrome or Edge browser.");
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

    return attemptRecognition();
  };

  return {
    isSupported,
    startRecording
  };
};
