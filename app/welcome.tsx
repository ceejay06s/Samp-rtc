import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DatingIcon } from '../src/components/DatingIcon';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Carousel } from '../src/components/ui/Carousel';
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';
import { isDesktopBrowser, isMobileBrowser } from '../src/utils/platform';
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
  isBreakpoint,
  wp
} from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function WelcomeScreen() {
  const theme = useTheme();
  const viewport = useViewport();
  const platform = usePlatform();

  // Responsive helpers
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();
  const isMobile = isMobileBrowser() || Platform.OS !== 'web';
  const isTablet = isBreakpoint.lg || isBreakpoint.md;

  const featureData = [
    {
      icon: 'heart',
      title: 'Smart Matching',
      description: 'Find compatible matches based on interests and preferences',
    },
    {
      icon: 'star',
      title: 'Progressive Levels',
      description: 'Build trust gradually with our 4-level matching system',
    },
    {
      icon: 'sparkle',
      title: 'Voice Calls',
      description: 'Connect deeper with voice messages and calls',
    },
  ];

  // Desktop-specific spacing and sizing
  const getDesktopSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const spacingMap = {
        xs: 8,
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
        xxl: 64,
      };
      return spacingMap[size];
    }
    return getResponsiveSpacing(size);
  };

  const getDesktopFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const fontSizeMap = {
        xs: 16,
        sm: 18,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
      };
      return fontSizeMap[size];
    }
    return getResponsiveFontSize(size);
  };

  const handleTermsPress = () => {
    // For now, show an alert. Later this can open a modal or navigate to terms page
    if (Platform.OS === 'web') {
      window.open('/terms', '_blank');
    } else {
      // For mobile, you could navigate to a terms screen
      console.log('Terms of Service pressed');
    }
  };

  const handlePrivacyPress = () => {
    // For now, show an alert. Later this can open a modal or navigate to privacy page
    if (Platform.OS === 'web') {
      window.open('/privacy', '_blank');
    } else {
      // For mobile, you could navigate to a privacy screen
      console.log('Privacy Policy pressed');
    }
  };

  const renderFeatureCard = (item: any, index: number) => (
    <Card 
      variant="elevated" 
      style={[
        styles.featureCard,
        isDesktop && styles.desktopFeatureCard
      ]}
      gradient="card"
    >
      <DatingIcon 
        size="large"
        variant={item.icon as any} 
        style={[
          styles.featureIcon,
          isDesktop && { marginBottom: getDesktopSpacing('md') }
        ]} 
      />
      <Text style={[
        styles.featureTitle, 
        { color: theme.colors.text },
        isDesktop && { 
          fontSize: getDesktopFontSize('lg'),
          marginBottom: getDesktopSpacing('sm')
        }
      ]}>
        {item.title}
      </Text>
      <Text style={[
        styles.featureText, 
        { color: theme.colors.textSecondary },
        isDesktop && { 
          fontSize: getDesktopFontSize('md'),
          lineHeight: getDesktopFontSize('md') * 1.6
        }
      ]}>
        {item.description}
      </Text>
    </Card>
  );

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={[
          styles.content,
          isDesktop && styles.desktopContent
        ]}>
          <View style={[
            styles.header,
            isDesktop && styles.desktopHeader
          ]}>
            <DatingIcon 
              size="large"
              variant="heart" 
              style={[
                styles.logo,
                isDesktop && { marginBottom: getDesktopSpacing('lg') }
              ]} 
            />
            <Text style={[
              styles.title, 
              { color: theme.colors.text },
              isDesktop && { 
                fontSize: getDesktopFontSize('xxl'),
                marginBottom: getDesktopSpacing('md'),
                letterSpacing: -1.5
              }
            ]}>
              Welcome to Spark
            </Text>
            <Text style={[
              styles.subtitle, 
              { color: theme.colors.textSecondary },
              isDesktop && { 
                fontSize: getDesktopFontSize('lg'),
                lineHeight: getDesktopFontSize('lg') * 1.4,
                maxWidth: wp(60)
              }
            ]}>
              Find your perfect match and start your journey to love
            </Text>
          </View>

          <View style={[
            styles.featuresContainer,
            isDesktop && styles.desktopFeaturesContainer
          ]}>
            <Carousel
              data={featureData}
              renderItem={renderFeatureCard}
              showPagination={true}
              style={[
                styles.carousel,
                isDesktop && styles.desktopCarousel
              ]}
            />
          </View>

          <View style={[
            styles.actionsContainer,
            isDesktop && styles.desktopActionsContainer
          ]}>
            <Button
              title="Get Started"
              onPress={() => router.push('/signup')}
              variant="gradient"
              gradient="primary"
              size="large"
              style={[
                styles.primaryButton,
                isDesktop && styles.desktopPrimaryButton
              ]}
            />
            
            <Button
              title="Sign In"
              onPress={() => router.push('/login')}
              variant="outline"
              size="large"
              style={[
                styles.secondaryButton,
                isDesktop && styles.desktopSecondaryButton
              ]}
            />
          </View>

          <View style={[
            styles.footer,
            isDesktop && styles.desktopFooter
          ]}>
            <Text style={[
              styles.footerText, 
              { color: theme.colors.textSecondary },
              isDesktop && { 
                fontSize: getDesktopFontSize('sm'),
                lineHeight: getDesktopFontSize('sm') * 1.4
              }
            ]}>
              By continuing, you agree to our{' '}
              <Text 
                style={[styles.linkText, { color: theme.colors.primary }]}
                onPress={() => handleTermsPress()}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                style={[styles.linkText, { color: theme.colors.primary }]}
                onPress={() => handlePrivacyPress()}
              >
                Privacy Policy
              </Text>
            </Text>
            
            <View style={[
              styles.licenseContainer,
              isDesktop && styles.desktopLicenseContainer
            ]}>
              <Text style={[
                styles.licenseText,
                { color: theme.colors.textSecondary },
                isDesktop && { fontSize: getDesktopFontSize('xs') }
              ]}>
                © 2024 Spark Dating App
              </Text>
              <Text style={[
                styles.licenseText,
                { color: theme.colors.textSecondary },
                isDesktop && { fontSize: getDesktopFontSize('xs') }
              ]}>
                All rights reserved
              </Text>
            </View>
            
            <Text style={[
              styles.licenseText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('xs') }
            ]}>
              Licensed under MIT License
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  desktopScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
    paddingTop: 80,
    paddingBottom: 40,
  },
  desktopContent: {
    maxWidth: 1200,
    width: '100%',
    paddingHorizontal: getResponsiveSpacing('xxl'),
    paddingTop: 60,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xxl'),
  },
  desktopHeader: {
    marginBottom: getResponsiveSpacing('xxl') * 1.5,
  },
  logo: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: getResponsiveFontSize('xxl') * 1.75,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: getResponsiveFontSize('lg'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('lg') * 1.4,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: getResponsiveSpacing('xxl'),
    height: 280,
  },
  desktopFeaturesContainer: {
    marginBottom: getResponsiveSpacing('xxl') * 1.5,
    height: 360,
  },
  carousel: {
    flex: 1,
  },
  desktopCarousel: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    alignItems: 'center',
    padding: getResponsiveSpacing('lg'),
    height: 220,
  },
  desktopFeatureCard: {
    padding: getResponsiveSpacing('xl'),
    height: 280,
    marginHorizontal: getResponsiveSpacing('md'),
    justifyContent: 'space-between',
  },
  featureIcon: {
    marginBottom: getResponsiveSpacing('md'),
  },
  featureTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
    letterSpacing: -0.3,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  featureText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('md') * 1.4,
    fontWeight: '500',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  actionsContainer: {
    marginBottom: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('xs'),
  },
  desktopActionsContainer: {
    marginBottom: getResponsiveSpacing('xl'),
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  primaryButton: {
    marginBottom: getResponsiveSpacing('md'),
    minHeight: 56,
    width: '100%',
  },
  desktopPrimaryButton: {
    minHeight: 64,
    marginBottom: getResponsiveSpacing('lg'),
  },
  secondaryButton: {
    marginBottom: getResponsiveSpacing('md'),
    minHeight: 56,
    width: '100%',
    borderWidth: 2,
  },
  desktopSecondaryButton: {
    minHeight: 64,
  },
  footer: {
    alignItems: 'center',
  },
  desktopFooter: {
    marginTop: getResponsiveSpacing('lg'),
  },
  footerText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('sm') * 1.4,
    fontWeight: '500',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  licenseContainer: {
    marginTop: getResponsiveSpacing('md'),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  desktopLicenseContainer: {
    marginTop: getResponsiveSpacing('md'),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getResponsiveSpacing('xs'),
  },
  licenseText: {
    fontSize: getResponsiveFontSize('xs'),
    textAlign: 'center',
    flexWrap: 'wrap',
  },
}); 