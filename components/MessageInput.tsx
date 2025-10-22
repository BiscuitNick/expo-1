import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  placeholder = 'Message...',
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (text.trim().length === 0) return;

    onSend(text.trim());
    setText('');

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const handleChangeText = (newText: string) => {
    setText(newText);

    // Trigger typing indicator
    if (newText.length > 0 && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    } else if (newText.length === 0 && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const handleKeyPress = (e: any) => {
    // On web, allow Enter to submit (unless Shift is held for new line)
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!disabled}
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            onKeyPress={handleKeyPress}
            returnKeyType="send"
          />

          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={[
                styles.webSendButton,
                canSend ? styles.webSendButtonActive : styles.webSendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <Text style={styles.webSendButtonText}>Send</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <IconSymbol
                name="arrow.up.circle.fill"
                size={32}
                color={canSend ? '#007AFF' : '#C7C7CC'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonActive: {
    opacity: 1,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  webSendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  webSendButtonActive: {
    backgroundColor: '#007AFF',
  },
  webSendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  webSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
