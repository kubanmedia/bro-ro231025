import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class VoiceService {
  private recording: Audio.Recording | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.start();
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });

        this.recording = recording;
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri?: string; blob?: Blob }> {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if (!this.mediaRecorder) {
            resolve({});
            return;
          }

          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
            resolve({ blob });
          };

          this.mediaRecorder.stop();
        });
      } else {
        if (!this.recording) {
          return {};
        }

        await this.recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        const uri = this.recording.getURI();
        this.recording = null;

        return { uri: uri || undefined };
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async transcribeAudio(audioData: { uri?: string; blob?: Blob }): Promise<string> {
    try {
      const formData = new FormData();

      if (Platform.OS === 'web' && audioData.blob) {
        formData.append('audio', audioData.blob, 'recording.webm');
      } else if (audioData.uri) {
        const uriParts = audioData.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        const audioFile = {
          uri: audioData.uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;

        formData.append('audio', audioFile);
      } else {
        throw new Error('No audio data provided');
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}

export const voiceService = new VoiceService();
