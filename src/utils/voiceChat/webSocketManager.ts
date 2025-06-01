
import { useToast } from '@/hooks/use-toast';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private clientId: string;
  private toast: any;

  constructor(clientId: string, toast: any) {
    this.clientId = clientId;
    this.toast = toast;
  }

  async connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to voice chat for client: ${this.clientId}`);
        
        const wsUrl = `wss://ghpljdgecjmhkwkfctgy.functions.supabase.co/realtime-voice-chat?clientId=${this.clientId}`;
        console.log('Connecting to WebSocket URL:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to voice chat');
          this.toast({
            title: "Voice Chat Connected",
            description: "You can now start speaking with the AI assistant",
          });
          resolve(this.ws!);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.toast({
            title: "Connection Error",
            description: "Failed to connect to voice chat. Please check your internet connection and try again.",
            variant: "destructive",
          });
          reject(error);
        };

      } catch (error) {
        console.error('Error connecting to voice chat:', error);
        this.toast({
          title: "Connection Failed",
          description: "Could not establish voice chat connection. Please try again.",
          variant: "destructive",
        });
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  getWebSocket() {
    return this.ws;
  }
}
