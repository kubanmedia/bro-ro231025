import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { useBrowserAgent } from '@/services/browserAgent';
import { voiceService } from '@/services/voiceService';

export default function HomeScreen() {
  const { user, isPremium } = useAuth();
  const { canUseTask, incrementUsage, getRemainingTasks, getTimeUntilReset } = useUsage();
  const { messages, sendMessage } = useBrowserAgent();
  
  const [input, setInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!canUseTask) {
      Alert.alert(
        'Usage Limit Reached',
        `Free tier allows 1 task every 3 days. ${
          isPremium ? '' : `Next task available in ${getTimeUntilReset}`
        }`
      );
      return;
    }

    const success = await incrementUsage();
    if (!success) {
      Alert.alert('Error', 'Could not process task. Please try again.');
      return;
    }

    const messageText = input;
    setInput('');
    await sendMessage(messageText);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);

      try {
        const audioData = await voiceService.stopRecording();
        const transcription = await voiceService.transcribeAudio(audioData);
        setInput(transcription);
      } catch (error) {
        console.error('Voice input error:', error);
        Alert.alert('Error', 'Failed to process voice input');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      const hasPermission = await voiceService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone access is required for voice input');
        return;
      }

      try {
        await voiceService.startRecording();
        setIsRecording(true);
      } catch (error) {
        console.error('Recording start error:', error);
        Alert.alert('Error', 'Failed to start recording');
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bro',
          headerStyle: { backgroundColor: '#0A0E27' },
          headerTintColor: '#fff',
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={styles.usageBadge}>
                <Sparkles size={14} color="#6366F1" />
                <Text style={styles.usageText}>
                  {isPremium ? '∞' : getRemainingTasks}
                </Text>
              </View>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Sparkles size={48} color="#6366F1" />
              <Text style={styles.emptyTitle}>Welcome to Bro</Text>
              <Text style={styles.emptySubtitle}>
                Your AI browser assistant. Ask me to search, navigate, fill forms, or automate any
                browser task.
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {message.parts.map((part, index) => {
                  if (part.type === 'text' && part.text) {
                    return (
                      <Text
                        key={index}
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userText : styles.assistantText,
                        ]}
                      >
                        {part.text}
                      </Text>
                    );
                  }

                  if (part.type === 'tool') {
                    return (
                      <View key={index} style={styles.toolCall}>
                        <Text style={styles.toolName}>🔧 {part.toolName}</Text>
                        {part.state === 'output-available' && (
                          <Text style={styles.toolOutput}>
                            {JSON.stringify(part.output, null, 2)}
                          </Text>
                        )}
                        {part.state === 'output-error' && (
                          <Text style={styles.toolError}>Error: {part.errorText}</Text>
                        )}
                      </View>
                    );
                  }

                  return null;
                })}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          {!isPremium && (
            <Text style={styles.limitText}>
              {canUseTask
                ? `${getRemainingTasks} task${getRemainingTasks !== 1 ? 's' : ''} remaining`
                : `Next task in ${getTimeUntilReset}`}
            </Text>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                (isRecording || isTranscribing) && styles.voiceButtonActive,
              ]}
              onPress={handleVoiceInput}
              disabled={isTranscribing}
              testID="voice-button"
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isRecording ? (
                <MicOff size={20} color="#fff" />
              ) : (
                <Mic size={20} color="#fff" />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Ask me to do anything..."
              placeholderTextColor="#666"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              testID="message-input"
            />

            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!input.trim()}
              testID="send-button"
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  headerRight: {
    marginRight: 16,
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  usageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B92B0',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1F3A',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#E5E7EB',
  },
  toolCall: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366F1',
    marginBottom: 4,
  },
  toolOutput: {
    fontSize: 12,
    color: '#8B92B0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toolError: {
    fontSize: 12,
    color: '#EF4444',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#0A0E27',
    borderTopWidth: 1,
    borderTopColor: '#1A1F3A',
  },
  limitText: {
    fontSize: 12,
    color: '#8B92B0',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#EF4444',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1F3A',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
