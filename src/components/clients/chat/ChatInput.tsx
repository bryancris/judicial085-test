
import React from "react";
import { useChatInputState } from "@/hooks/useChatInputState";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import InterviewModeToggle from "./InterviewModeToggle";
import TabSelector from "./TabSelector";
import MessageTextArea from "./MessageTextArea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeTab: "attorney" | "client";
  onTabChange: (tab: "attorney" | "client") => void;
  prefilledMessage?: string;
  interviewMode: boolean;
  onInterviewModeChange: (enabled: boolean) => void;
}

const ChatInput = ({ 
  onSendMessage, 
  isLoading, 
  activeTab, 
  onTabChange,
  prefilledMessage = "",
  interviewMode,
  onInterviewModeChange
}: ChatInputProps) => {
  const {
    message,
    setMessage,
    textareaRef,
    handleSendMessage,
    handleKeyDown
  } = useChatInputState({ prefilledMessage });

  const {
    isRecording,
    isRequestingPermission,
    toggleRecording
  } = useVoiceInput();

  // Get placeholder text based on mode
  const getPlaceholderText = () => {
    if (!interviewMode) {
      return "Enter case facts and information...";
    }
    return `Enter ${activeTab === "attorney" ? "attorney's question" : "client's response"}...`;
  };

  // Get send button text based on mode
  const getSendButtonText = () => {
    if (!interviewMode) {
      return "Analyze";
    }
    return `Send as ${activeTab === "attorney" ? "Attorney" : "Client"}`;
  };

  // Get send button color based on mode
  const getSendButtonColor = () => {
    if (!interviewMode) {
      return "bg-[#059669] hover:bg-[#047857]"; // Green for analyze
    }
    return activeTab === "attorney" ? "bg-[#0EA5E9] hover:bg-[#0EA5E9]/90" : "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90";
  };

  const handleToggleRecording = () => {
    toggleRecording(setMessage);
  };

  const handleSend = () => {
    handleSendMessage(onSendMessage);
  };

  const handleKeyDownEvent = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleKeyDown(e, onSendMessage);
  };

  return (
    <div className="border-t p-3 bg-background">
      <InterviewModeToggle 
        interviewMode={interviewMode}
        onInterviewModeChange={onInterviewModeChange}
      />

      <TabSelector 
        activeTab={activeTab}
        onTabChange={onTabChange}
        interviewMode={interviewMode}
      />

      <MessageTextArea
        message={message}
        onMessageChange={setMessage}
        onKeyDown={handleKeyDownEvent}
        onSendMessage={handleSend}
        isLoading={isLoading}
        isRecording={isRecording}
        isRequestingPermission={isRequestingPermission}
        onToggleRecording={handleToggleRecording}
        placeholder={getPlaceholderText()}
        sendButtonText={getSendButtonText()}
        sendButtonColor={getSendButtonColor()}
        textareaRef={textareaRef}
      />
    </div>
  );
};

export default ChatInput;
