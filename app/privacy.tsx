import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { isDesktopBrowser } from '../src/utils/platform';
import { getResponsiveFontSize, getResponsiveSpacing, isBreakpoint } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function PrivacyScreen() {
  const theme = useTheme();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();

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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.desktopContent
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        
        <Text style={[
          styles.title,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('xxl') }
        ]}>
          Privacy Policy
        </Text>
        <Text style={[
          styles.subtitle,
          { color: theme.colors.textSecondary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          Last updated: January 2024
        </Text>
      </View>

      <Card style={[styles.privacyCard, isDesktop && styles.desktopPrivacyCard]} variant="elevated">
        <ScrollView style={styles.privacyContent}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              1. Information We Collect
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We collect information you provide directly to us, such as when you create an account, complete your profile, or communicate with other users. This includes your name, email address, photos, interests, and preferences.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              2. How We Use Your Information
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We use the information we collect to provide, maintain, and improve our services, to match you with other users, to communicate with you, and to ensure the safety and security of our platform.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              3. Information Sharing
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with law enforcement when required by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              4. Data Security
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              5. Your Rights
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              You have the right to access, update, or delete your personal information. You can also control your privacy settings and opt out of certain communications. Contact us to exercise these rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              6. Cookies and Tracking
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              7. Children&apos;s Privacy
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If you believe we have collected such information, please contact us.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              8. Changes to This Policy
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              9. Contact Us
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              If you have any questions about this Privacy Policy, please contact us at privacy@sparkdating.com
            </Text>
          </View>
        </ScrollView>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getResponsiveSpacing('lg'),
    paddingTop: 60,
  },
  desktopContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: getResponsiveSpacing('xxl'),
  },
  header: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  backButton: {
    marginBottom: getResponsiveSpacing('md'),
  },
  backButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize('xxl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: getResponsiveFontSize('md'),
    color: '#666',
  },
  privacyCard: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  desktopPrivacyCard: {
    padding: getResponsiveSpacing('xl'),
  },
  privacyContent: {
    flex: 1,
  },
  section: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing('sm'),
  },
  sectionText: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.5,
  },
}); 