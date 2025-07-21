import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';

// Web-specific imports
let ReactEasyCrop: any = null;
if (typeof window !== 'undefined') {
  try {
    ReactEasyCrop = require('react-easy-crop').default;
  } catch (error) {
    console.warn('react-easy-crop not available for web');
  }
}

// Mobile-specific imports
import * as ImageManipulator from 'expo-image-manipulator';
import { Dimensions, Image } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

interface CrossPlatformImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedImageUri: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export const CrossPlatformImageCropper: React.FC<CrossPlatformImageCropperProps> = ({
  imageUri,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4,
}) => {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const [isProcessing, setIsProcessing] = useState(false);

  // Web-specific state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Mobile-specific state
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cropWidth = screenWidth - 40;
  const cropHeight = cropWidth * aspectRatio;

  // Web crop handlers
  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onCropCompleteWeb = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  // Mobile crop handlers
  const onImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent;
    setImageSize({ width, height });
    
    const initialX = (screenWidth - cropWidth) / 2;
    const initialY = (screenHeight - cropHeight) / 2;
    setCropArea({
      x: initialX,
      y: initialY,
      width: cropWidth,
      height: cropHeight,
    });
  }, [screenWidth, screenHeight, cropWidth, cropHeight]);

  const onGestureEvent = useCallback((event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent;
      setCropArea(prev => ({
        ...prev,
        x: Math.max(20, Math.min(screenWidth - cropWidth - 20, prev.x + translationX)),
        y: Math.max(20, Math.min(screenHeight - cropHeight - 20, prev.y + translationY)),
      }));
    }
  }, [screenWidth, screenHeight, cropWidth, cropHeight]);

  const handleCropComplete = async () => {
    setIsProcessing(true);
    try {
      if (isWeb && ReactEasyCrop) {
        // Web cropping using react-easy-crop
        await handleWebCrop();
      } else {
        // Mobile cropping using expo-image-manipulator
        await handleMobileCrop();
      }
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebCrop = async () => {
    if (!croppedAreaPixels) {
      throw new Error('No crop area selected');
    }

    // For web, we'll create a canvas and crop the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new window.Image();
    
    return new Promise((resolve, reject) => {
      image.onload = () => {
        const { width, height } = croppedAreaPixels;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          width,
          height,
          0,
          0,
          width,
          height
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            onCropComplete(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      image.onerror = reject;
      image.src = imageUri;
    });
  };

  const handleMobileCrop = async () => {
    const cropX = (cropArea.x - 20) / (screenWidth - 40) * imageSize.width;
    const cropY = (cropArea.y - 20) / (screenHeight - 40) * imageSize.height;
    const cropWidthInImage = cropWidth / (screenWidth - 40) * imageSize.width;
    const cropHeightInImage = cropHeight / (screenHeight - 40) * imageSize.height;

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: Math.max(0, cropX),
            originY: Math.max(0, cropY),
            width: Math.min(cropWidthInImage, imageSize.width - cropX),
            height: Math.min(cropHeightInImage, imageSize.height - cropY),
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    onCropComplete(result.uri);
  };

  const handleReset = () => {
    if (isWeb) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      const initialX = (screenWidth - cropWidth) / 2;
      const initialY = (screenHeight - cropHeight) / 2;
      setCropArea({
        x: initialX,
        y: initialY,
        width: cropWidth,
        height: cropHeight,
      });
    }
  };

  // Web render
  if (isWeb && ReactEasyCrop) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Crop Photo
          </Text>
          
          <TouchableOpacity 
            onPress={handleCropComplete} 
            style={styles.headerButton}
            disabled={isProcessing}
          >
            <Text style={[
              styles.headerButtonText, 
              { 
                color: isProcessing ? theme.colors.textSecondary : theme.colors.primary,
                fontWeight: '600'
              }
            ]}>
              {isProcessing ? 'Processing...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Web Crop Area */}
        <View style={styles.cropContainer}>
          <ReactEasyCrop
            image={imageUri}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteWeb}
            onZoomChange={onZoomChange}
            style={styles.webCropArea}
          />
        </View>

        {/* Controls */}
        <View style={[styles.controls, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.instructions}>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              • Drag to move the crop area
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              • Pinch to zoom in/out
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              • The crop area maintains a 3:4 aspect ratio
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="Reset"
              onPress={handleReset}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            />
          </View>
        </View>
      </View>
    );
  }

  // Mobile render
  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Crop Photo
        </Text>
        
        <TouchableOpacity 
          onPress={handleCropComplete} 
          style={styles.headerButton}
          disabled={isProcessing}
        >
          <Text style={[
            styles.headerButtonText, 
            { 
              color: isProcessing ? theme.colors.textSecondary : theme.colors.primary,
              fontWeight: '600'
            }
          ]}>
            {isProcessing ? 'Processing...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mobile Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
          onLoad={onImageLoad}
        />
        
        {/* Crop Overlay */}
        <View style={styles.cropOverlay}>
          <View style={styles.overlay} />
          
          <PanGestureHandler onGestureEvent={onGestureEvent}>
            <View style={[
              styles.cropFrame,
              {
                position: 'absolute',
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
              }
            ]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </PanGestureHandler>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            • Drag the crop frame to position it
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            • The crop area maintains a 3:4 aspect ratio
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            • Tap Done when you're satisfied with the crop
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Reset"
            onPress={handleReset}
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    height: 60,
  },
  headerButton: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  headerButtonText: {
    fontSize: getResponsiveFontSize('md'),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  cropContainer: {
    flex: 1,
    position: 'relative',
  },
  webCropArea: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cropFrame: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 2,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  controls: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing('md'),
  },
  actionButton: {
    flex: 1,
    maxWidth: 200,
  },
  instructions: {
    paddingBottom: getResponsiveSpacing('md'),
  },
  instructionText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
}); 