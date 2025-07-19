import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useRTPCall } from '../../hooks/useRTPCall';
import { CallType, MatchLevel } from '../../types';
import { useTheme } from '../../utils/themes';

interface CallButtonProps {
  match: {
    id: string;
    level: number;
    user1_id: string;
    user2_id: string;
    user1_profile?: any;
    user2_profile?: any;
  };
  currentUserId: string;
  onCallStart?: (callType: CallType) => void;
}

export const CallButton: React.FC<CallButtonProps> = ({
  match,
  currentUserId,
  onCallStart,
}) => {
  const theme = useTheme();
  const [showCallOptions, setShowCallOptions] = useState(false);
  
  const { initiateCall, isInCall, isInitializing } = useRTPCall();

  // Determine if user can make calls based on match level
  const canMakeVoiceCall = match.level >= MatchLevel.LEVEL_4;
  const canMakeVideoCall = match.level >= MatchLevel.LEVEL_4;

  // Get the other user's ID and profile
  const isUser1 = match.user1_id === currentUserId;
  const otherUserId = isUser1 ? match.user2_id : match.user1_id;
  const otherProfile = isUser1 ? match.user2_profile : match.user1_profile;

  const handleCallPress = () => {
    if (!canMakeVoiceCall) {
      Alert.alert(
        'Level 4 Required',
        'Voice calls require a Level 4 match. Keep chatting to unlock this feature!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (canMakeVideoCall) {
      setShowCallOptions(true);
    } else {
      initiateVoiceCall();
    }
  };

  const initiateVoiceCall = async () => {
    try {
      await initiateCall(match.id, otherUserId, CallType.VOICE);
      onCallStart?.(CallType.VOICE);
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
      Alert.alert('Error', 'Failed to start voice call. Please try again.');
    }
  };

  const initiateVideoCall = async () => {
    try {
      await initiateCall(match.id, otherUserId, CallType.VIDEO);
      onCallStart?.(CallType.VIDEO);
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      Alert.alert('Error', 'Failed to start video call. Please try again.');
    }
  };

  const handleCallOption = (callType: CallType) => {
    setShowCallOptions(false);
    if (callType === CallType.VOICE) {
      initiateVoiceCall();
    } else {
      initiateVideoCall();
    }
  };

  if (isInCall || isInitializing) {
    return (
      <View style={[styles.container, styles.disabled]}>
        <MaterialIcons name="call" size={20} color={theme.colors.disabled} />
        <Text style={[styles.text, { color: theme.colors.disabled }]}>
          {isInitializing ? 'Calling...' : 'In Call'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.callButton,
          {
            backgroundColor: canMakeVoiceCall ? theme.colors.primary : theme.colors.disabled,
          },
        ]}
        onPress={handleCallPress}
        disabled={!canMakeVoiceCall}
      >
        <MaterialIcons
          name="call"
          size={20}
          color={canMakeVoiceCall ? theme.colors.onPrimary : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Call options modal */}
      {showCallOptions && (
        <View style={styles.callOptionsOverlay}>
          <View style={[styles.callOptions, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.callOptionsTitle, { color: theme.colors.text }]}>
              Choose Call Type
            </Text>
            
            <TouchableOpacity
              style={[styles.callOption, { borderColor: theme.colors.border }]}
              onPress={() => handleCallOption(CallType.VOICE)}
            >
              <MaterialIcons name="call" size={24} color={theme.colors.primary} />
              <Text style={[styles.callOptionText, { color: theme.colors.text }]}>
                Voice Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callOption, { borderColor: theme.colors.border }]}
              onPress={() => handleCallOption(CallType.VIDEO)}
            >
              <MaterialIcons name="videocam" size={24} color={theme.colors.primary} />
              <Text style={[styles.callOptionText, { color: theme.colors.text }]}>
                Video Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.error }]}
              onPress={() => setShowCallOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.onPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  callOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  callOptions: {
    width: 280,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  callOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  callOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  callOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 