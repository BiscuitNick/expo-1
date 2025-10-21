import { format } from 'date-fns';
import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn: boolean;
}

interface MessageBubbleProps {
  message: Message;
  showSenderName?: boolean; // For group chats
  previousMessageSameSender?: boolean;
}

export default function MessageBubble({
  message,
  showSenderName = false,
  previousMessageSameSender = false,
}: MessageBubbleProps) {
  const formatTime = (timestamp: Date) => {
    return format(timestamp, 'h:mm a');
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  return (
    <View
      style={[
        styles.container,
        message.isOwn ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      {/* Sender name for group chats (only for other people's messages) */}
      {showSenderName && !message.isOwn && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          message.isOwn ? styles.ownBubble : styles.otherBubble,
          previousMessageSameSender && styles.bubbleGrouped,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message.text}
        </Text>

        {/* Timestamp and status */}
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.timestamp,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>

          {/* Status indicator (only for own messages) */}
          {message.isOwn && message.status && (
            <Text
              style={[
                styles.statusIcon,
                message.status === 'read' && styles.readStatus,
              ]}
            >
              {getStatusIcon()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 12,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleGrouped: {
    marginTop: 1,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  statusIcon: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    color: '#4CAF50',
  },
});
