/**
 * Chat Page - Main chat interface
 */

import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="container mx-auto h-screen max-w-4xl p-4">
      <ChatInterface />
    </div>
  );
}