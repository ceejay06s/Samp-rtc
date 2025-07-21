import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function UserProfileRedirect() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  
  useEffect(() => {
    if (userId) {
      // Redirect to the new dynamic route
      router.replace(`/user-profile/${userId}`);
    } else {
      // If no userId, go back or to a default page
      router.back();
    }
  }, [userId]);

  // This component doesn't render anything, it just handles the redirect
  return null;
} 