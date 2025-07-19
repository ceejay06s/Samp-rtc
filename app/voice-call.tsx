import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { CallScreen } from '../src/components/ui/CallScreen';
import { CallType } from '../src/types';

export default function VoiceCallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const matchId = params.matchId as string;
  const receiverId = params.receiverId as string;
  const callType = (params.callType as string) === 'video' ? CallType.VIDEO : CallType.VOICE;

  const handleCallEnd = () => {
    // Navigate back to matches screen
    router.back();
  };

  if (!matchId || !receiverId) {
    return null;
  }

  return (
    <CallScreen
      matchId={matchId}
      receiverId={receiverId}
      callType={callType}
      onCallEnd={handleCallEnd}
    />
  );
} 