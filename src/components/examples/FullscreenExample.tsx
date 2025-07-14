import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFullscreen } from '../../services/fullscreen';
import { useTheme } from '../../utils/themes';
import { Button, Card, FullscreenToggle } from '../ui';

export const FullscreenExample: React.FC = () => {
  const theme = useTheme();
  const { 
    isFullscreen, 
    statusBarHidden, 
    navigationBarHidden, 
    immersiveMode,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    setStatusBarHidden,
    setStatusBarStyle,
    isSupported 
  } = useFullscreen();

  const handleEnterFullscreen = async () => {
    await enterFullscreen({
      hideStatusBar: true,
      hideNavigationBar: true,
      immersiveMode: true,
      backgroundColor: '#000000',
      barStyle: 'light-content',
    });
  };

  const handleExitFullscreen = async () => {
    await exitFullscreen();
  };

  const handleToggleFullscreen = async () => {
    await toggleFullscreen({
      hideStatusBar: true,
      hideNavigationBar: true,
      immersiveMode: true,
      backgroundColor: '#000000',
      barStyle: 'light-content',
    });
  };

  const handleHideStatusBar = () => {
    setStatusBarHidden(true, 'slide');
  };

  const handleShowStatusBar = () => {
    setStatusBarHidden(false, 'slide');
  };

  const handleLightStatusBar = () => {
    setStatusBarStyle('light-content');
  };

  const handleDarkStatusBar = () => {
    setStatusBarStyle('dark-content');
  };

  if (!isSupported) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Fullscreen Not Supported
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Fullscreen mode is only available in standalone apps or web browsers.
        </Text>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Fullscreen Controls
        </Text>
        
        {/* Current State */}
        <View style={styles.stateContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Current State:
          </Text>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Fullscreen: {isFullscreen ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Status Bar Hidden: {statusBarHidden ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Navigation Bar Hidden: {navigationBarHidden ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Immersive Mode: {immersiveMode ? 'Yes' : 'No'}
          </Text>
        </View>

        {/* Fullscreen Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Fullscreen Controls:
          </Text>
          
          <View style={styles.buttonRow}>
            <Button
              title="Enter Fullscreen"
              onPress={handleEnterFullscreen}
              variant="primary"
              size="small"
              style={styles.button}
            />
            <Button
              title="Exit Fullscreen"
              onPress={handleExitFullscreen}
              variant="secondary"
              size="small"
              style={styles.button}
            />
          </View>
          
          <Button
            title="Toggle Fullscreen"
            onPress={handleToggleFullscreen}
            variant="accent"
            size="medium"
            style={styles.fullWidthButton}
          />
        </View>

        {/* Status Bar Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Status Bar Controls:
          </Text>
          
          <View style={styles.buttonRow}>
            <Button
              title="Hide Status Bar"
              onPress={handleHideStatusBar}
              variant="outline"
              size="small"
              style={styles.button}
            />
            <Button
              title="Show Status Bar"
              onPress={handleShowStatusBar}
              variant="outline"
              size="small"
              style={styles.button}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <Button
              title="Light Status Bar"
              onPress={handleLightStatusBar}
              variant="outline"
              size="small"
              style={styles.button}
            />
            <Button
              title="Dark Status Bar"
              onPress={handleDarkStatusBar}
              variant="outline"
              size="small"
              style={styles.button}
            />
          </View>
        </View>

        {/* Fullscreen Toggle Components */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Fullscreen Toggle Components:
          </Text>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>
              Icon Toggle:
            </Text>
            <FullscreenToggle variant="icon" size="medium" />
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>
              Button Toggle:
            </Text>
            <FullscreenToggle variant="button" size="medium" showLabel={true} />
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>
              Text Toggle:
            </Text>
            <FullscreenToggle variant="text" size="medium" />
          </View>
        </View>

        {/* Usage Examples */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Usage Examples:
          </Text>
          
          <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
            • Video players can use fullscreen for immersive viewing
          </Text>
          <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
            • Games can hide UI elements for distraction-free gameplay
          </Text>
          <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
            • Photo viewers can maximize screen real estate
          </Text>
          <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
            • Voice calls can use fullscreen for better focus
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  stateContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullWidthButton: {
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
}); 