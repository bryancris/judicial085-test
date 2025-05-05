
// Voice to text utilities using Web Speech API with fallback options

/**
 * Handles speech recognition using the browser's Web Speech API
 */
export const useSpeechRecognition = () => {
  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  // Initialize the speech recognition API
  const startRecording = (onResultCallback: (text: string) => void, onErrorCallback: (error: string) => void) => {
    if (!isSupported) {
      onErrorCallback("Speech recognition is not supported in this browser");
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
      onErrorCallback(`Error: ${event.error}`);
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Only call the callback with final transcript if something was recognized
      if (finalTranscript) {
        onResultCallback(finalTranscript);
      }
    };
    
    console.log("Starting speech recognition");
    recognition.start();
    
    return {
      stop: () => {
        recognition.stop();
      }
    };
  };

  return {
    isSupported,
    startRecording
  };
};
