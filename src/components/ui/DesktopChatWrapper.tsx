import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useViewport } from '../../hooks/useViewport';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DesktopChatWrapperProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showHeader?: boolean;
  maxWidth?: number;
}

export const DesktopChatWrapper: React.FC<DesktopChatWrapperProps> = ({
  children,
  title = 'Chat',
  onBack,
  showHeader = true,
  maxWidth = 1200,
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser;
  
  const [windowDimensions, setWindowDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Only apply desktop styling on desktop browsers
  if (!isDesktop) {
    return <>{children}</>;
  }

  const containerWidth = Math.min(maxWidth, windowDimensions.width - 40);
  const containerHeight = windowDimensions.height - 40;

  return (
    <View style={[styles.desktopContainer, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.chatContainer,
        {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: theme.colors.surface,
        }
      ]}>
        {/* Desktop Header */}
        {showHeader && (
          <View style={[
            styles.desktopHeader,
            { 
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            }
          ]}>
            <View style={styles.headerLeft}>
              {onBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                >
                  <MaterialIcons
                    name="arrow-back"
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}
              <Text style={[
                styles.headerTitle,
                { color: theme.colors.text }
              ]}>
                {title}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <MaterialIcons
                  name="more-vert"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chat Content */}
        <KeyboardAvoidingView
          style={styles.chatContent}
          behavior={Platform.OS === 'web' ? undefined : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'web' ? 0 : 90}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  chatContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    minHeight: 64,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: getResponsiveSpacing('sm'),
    marginRight: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: getResponsiveSpacing('sm'),
    marginLeft: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  chatContent: {
    flex: 1,
  },
}); 