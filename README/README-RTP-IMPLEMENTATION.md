# RTP (Real-Time Protocol) Implementation

This document describes the comprehensive RTP implementation for real-time voice and video communication in the dating app using Supabase as the signaling server and WebRTC for peer-to-peer connections.

## 🏗️ Architecture Overview

### Components
1. **RTP Service** (`src/services/rtpService.ts`) - Manages call signaling through Supabase
2. **WebRTC Manager** (`src/services/webRTCManager.ts`) - Handles peer-to-peer connections
3. **RTP Hook** (`src/hooks/useRTPCall.ts`) - React hook for call management
4. **Call Screen** (`src/components/ui/CallScreen.tsx`) - UI for voice/video calls
5. **Call Button** (`src/components/ui/CallButton.tsx`) - UI component for initiating calls

### Database Schema
- `rtp_calls` - Call records and status
- `rtp_connections` - WebRTC peer connections
- `rtp_offers` - SDP offer/answer exchange
- `rtp_ice_candidates` - ICE candidate exchange
- `rtp_call_quality` - Call quality metrics

## 🚀 Features

### Voice Calls
- ✅ High-quality audio communication
- ✅ Echo cancellation and noise suppression
- ✅ Audio level monitoring
- ✅ Call duration tracking
- ✅ Call history and statistics

### Video Calls
- ✅ HD video streaming (720p)
- ✅ Camera switching (front/back)
- ✅ Video quality monitoring
- ✅ Bandwidth optimization

### Call Management
- ✅ Incoming call notifications
- ✅ Call acceptance/rejection
- ✅ Call status tracking
- ✅ Automatic call cleanup
- ✅ Call quality reporting

### Security
- ✅ End-to-end encryption (WebRTC)
- ✅ Row Level Security (RLS)
- ✅ User authentication required
- ✅ Match level restrictions

## 📋 Setup Instructions

### 1. Database Setup

Run the RTP schema in your Supabase SQL editor:

```sql
-- Execute the contents of sql/rtp-schema.sql
```

This creates all necessary tables, indexes, and RLS policies.

### 2. Dependencies

The implementation uses:
- `expo-av` - Media handling
- `@supabase/supabase-js` - Backend communication
- React Native WebRTC (for production)

### 3. Environment Configuration

Ensure your Supabase project has:
- Real-time subscriptions enabled
- Row Level Security (RLS) enabled
- Proper authentication setup

## 🔧 Usage

### Basic Call Implementation

```typescript
import { useRTPCall } from '../hooks/useRTPCall';
import { CallType } from '../types';

function MyComponent() {
  const {
    initiateCall,
    isInCall,
    callStatus,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useRTPCall();

  const startVoiceCall = async () => {
    try {
      await initiateCall(matchId, receiverId, CallType.VOICE);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  return (
    <TouchableOpacity onPress={startVoiceCall}>
      <Text>Start Voice Call</Text>
    </TouchableOpacity>
  );
}
```

### Call Screen Integration

```typescript
import { CallScreen } from '../components/ui/CallScreen';

function CallScreenWrapper() {
  return (
    <CallScreen
      matchId="match-id"
      receiverId="receiver-id"
      callType={CallType.VOICE}
      onCallEnd={() => {
        // Handle call end
      }}
    />
  );
}
```

### Call Button Component

```typescript
import { CallButton } from '../components/ui/CallButton';

function MatchCard({ match }) {
  return (
    <CallButton
      match={match}
      currentUserId={user.id}
      onCallStart={(callType) => {
        // Navigate to call screen
      }}
    />
  );
}
```

## 🔄 Call Flow

### 1. Call Initiation
1. User clicks call button
2. `CallButton` component validates match level
3. `useRTPCall` hook creates call record
4. WebRTC manager initializes peer connection
5. Local media stream is captured
6. SDP offer is created and sent via Supabase

### 2. Call Signaling
1. Receiver gets real-time notification
2. Receiver accepts/rejects call
3. If accepted, receiver creates SDP answer
4. ICE candidates are exchanged
5. Peer connection is established

### 3. Active Call
1. Audio/video streams are connected
2. Call quality is monitored
3. User can toggle audio/video
4. Call duration is tracked

### 4. Call Termination
1. User ends call or connection drops
2. Call status is updated
3. Media streams are stopped
4. Resources are cleaned up

## 📊 Call Quality Monitoring

The system tracks:
- Audio levels
- Video quality
- Network latency
- Packet loss
- Jitter

Data is stored in `rtp_call_quality` table for analytics.

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own calls
- Call data is protected by user authentication
- ICE candidates are user-specific

### WebRTC Security
- End-to-end encryption
- Secure peer connections
- STUN/TURN server support

### Input Validation
- All user inputs are validated
- SQL injection protection
- XSS prevention

## 🎯 Match Level Integration

Calls are restricted by match levels:
- **Level 1-3**: No calls allowed
- **Level 4**: Voice and video calls enabled

This ensures users build trust before calling.

## 🚨 Error Handling

### Common Issues
1. **Permission Denied**: Check microphone/camera permissions
2. **Network Issues**: ICE connection failures
3. **Call Timeout**: No response from receiver
4. **Media Errors**: Device not available

### Error Recovery
- Automatic retry for network issues
- Graceful degradation for media problems
- User-friendly error messages

## 📱 Platform Support

### iOS
- ✅ Voice calls
- ✅ Video calls
- ✅ Background audio
- ✅ Camera switching

### Android
- ✅ Voice calls
- ✅ Video calls
- ✅ Background audio
- ✅ Camera switching

### Web
- ✅ Voice calls
- ✅ Video calls
- ✅ Screen sharing (future)
- ✅ File sharing (future)

## 🔧 Configuration

### STUN/TURN Servers
```typescript
// In webRTCManager.ts
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add your TURN servers for production
];
```

### Call Settings
```typescript
// Audio constraints
const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

// Video constraints
const videoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'user',
};
```

## 📈 Performance Optimization

### Bandwidth Management
- Adaptive bitrate for video
- Audio-only fallback
- Quality monitoring

### Memory Management
- Automatic cleanup of ended calls
- Stream disposal
- Connection cleanup

### Battery Optimization
- Efficient media handling
- Background processing
- Wake lock management

## 🧪 Testing

### Unit Tests
```bash
npm test -- --testPathPattern=rtp
```

### Integration Tests
- Test call flow end-to-end
- Test signaling with multiple users
- Test error scenarios

### Performance Tests
- Measure call quality
- Test bandwidth usage
- Monitor memory usage

## 🚀 Deployment

### Production Checklist
- [ ] TURN servers configured
- [ ] SSL certificates installed
- [ ] RLS policies verified
- [ ] Error monitoring enabled
- [ ] Performance monitoring set up

### Monitoring
- Call success rates
- Call quality metrics
- Error rates
- User engagement

## 🔮 Future Enhancements

### Planned Features
- Screen sharing
- File sharing during calls
- Group calls
- Call recording (with consent)
- Advanced call controls

### Technical Improvements
- WebRTC data channels
- Advanced codec support
- AI-powered call quality optimization
- Predictive bandwidth management

## 📞 Support

For issues or questions:
1. Check the error logs
2. Verify database schema
3. Test with different devices
4. Contact the development team

## 📄 License

This RTP implementation is part of the dating app project and follows the same license terms. 