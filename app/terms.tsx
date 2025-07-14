import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { isDesktopBrowser } from '../src/utils/platform';
import { getResponsiveFontSize, getResponsiveSpacing, isBreakpoint } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function TermsScreen() {
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
          Terms of Service
        </Text>
        <Text style={[
          styles.subtitle,
          { color: theme.colors.textSecondary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          Last updated: January 2024
        </Text>
      </View>

      <Card style={[styles.termsCard, isDesktop && styles.desktopTermsCard]} variant="elevated">
        <ScrollView style={styles.termsContent}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              1. Acceptance of Terms
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              By accessing and using Spark Dating App, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              2. User Eligibility
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              You must be at least 18 years old to use Spark Dating App. By using our service, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              3. User Conduct
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              You agree to use Spark Dating App only for lawful purposes and in accordance with these Terms. You agree not to use the service to harass, abuse, or harm other users, or to post inappropriate, offensive, or illegal content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              4. Privacy and Data Protection
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices regarding the collection and use of your personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              5. Intellectual Property
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              The service and its original content, features, and functionality are and will remain the exclusive property of Spark Dating App and its licensors. The service is protected by copyright, trademark, and other laws.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              6. Termination
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              7. Limitation of Liability
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              In no event shall Spark Dating App, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              8. Contact Information
            </Text>
            <Text style={[
              styles.sectionText,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.6 }
            ]}>
              If you have any questions about these Terms of Service, please contact us at legal@sparkdating.com
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
  termsCard: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  desktopTermsCard: {
    padding: getResponsiveSpacing('xl'),
  },
  termsContent: {
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