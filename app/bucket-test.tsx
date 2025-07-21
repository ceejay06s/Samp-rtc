import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { BucketTest, BucketTestResult } from '../src/utils/bucketTest';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function BucketTestScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<BucketTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const runBucketTest = async () => {
    setIsRunning(true);
    try {
      console.log('Starting bucket connection test...');
      const result = await BucketTest.testBucketConnection();
      setTestResult(result);
      
      // Get specific issues and recommendations
      const diagnosisIssues = await BucketTest.diagnoseIssues();
      const diagnosisRecommendations = BucketTest.getRecommendations(diagnosisIssues);
      
      setIssues(diagnosisIssues);
      setRecommendations(diagnosisRecommendations);
      
      console.log('Bucket test completed:', result);
    } catch (error) {
      console.error('Bucket test failed:', error);
      Alert.alert('Test Failed', 'Failed to run bucket connection test');
    } finally {
      setIsRunning(false);
    }
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
          Test Results
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusItem, { backgroundColor: testResult.success ? theme.colors.success : theme.colors.error }]}>
            <Text style={[styles.statusText, { color: '#fff' }]}>
              {testResult.success ? '✓ All Tests Passed' : '✗ Some Tests Failed'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Bucket Status:</Text>
          <Text style={[styles.detailText, { color: testResult.bucketExists ? theme.colors.success : theme.colors.error }]}>
            • Bucket Exists: {testResult.bucketExists ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.detailText, { color: testResult.bucketAccessible ? theme.colors.success : theme.colors.error }]}>
            • Bucket Accessible: {testResult.bucketAccessible ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.detailText, { color: testResult.canUpload ? theme.colors.success : theme.colors.error }]}>
            • Can Upload: {testResult.canUpload ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.detailText, { color: testResult.canDownload ? theme.colors.success : theme.colors.error }]}>
            • Can Download: {testResult.canDownload ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.detailText, { color: testResult.canDelete ? theme.colors.success : theme.colors.error }]}>
            • Can Delete: {testResult.canDelete ? 'Yes' : 'No'}
          </Text>
        </View>

        {testResult.errors.length > 0 && (
          <View style={styles.errorsContainer}>
            <Text style={[styles.detailTitle, { color: theme.colors.error }]}>Errors:</Text>
            {testResult.errors.map((error, index) => (
              <Text key={index} style={[styles.errorText, { color: theme.colors.error }]}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        {testResult.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={[styles.detailTitle, { color: theme.colors.warning }]}>Warnings:</Text>
            {testResult.warnings.map((warning, index) => (
              <Text key={index} style={[styles.warningText, { color: theme.colors.warning }]}>
                • {warning}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderIssues = () => {
    if (issues.length === 0) return null;

    return (
      <View style={styles.issuesContainer}>
        <Text style={[styles.detailTitle, { color: theme.colors.error }]}>Issues Found:</Text>
        {issues.map((issue, index) => (
          <Text key={index} style={[styles.issueText, { color: theme.colors.error }]}>
            • {issue}
          </Text>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={[styles.detailTitle, { color: theme.colors.primary }]}>Recommendations:</Text>
        {recommendations.map((recommendation, index) => (
          <Text key={index} style={[styles.recommendationText, { color: theme.colors.primary }]}>
            • {recommendation}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Bucket Connection Test
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Storage Bucket Test
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            This test will check if your Supabase storage bucket is properly configured and accessible.
          </Text>
        </View>

        {!user && (
          <View style={styles.authWarning}>
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              ⚠️ You need to be logged in to test bucket access
            </Text>
          </View>
        )}

        <Button
          title={isRunning ? 'Running Test...' : 'Run Bucket Test'}
          onPress={runBucketTest}
          disabled={isRunning || !user}
          style={styles.testButton}
        />

        {renderTestResult()}
        {renderIssues()}
        {renderRecommendations()}

        <View style={styles.helpContainer}>
          <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
            Need Help?
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            If you're having issues with bucket connection:
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            1. Run the SQL script: sql/fix-bucket-connection.sql
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            2. Check your Supabase project settings
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            3. Verify your API keys are correct
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            4. Upgrade to Pro plan if on free plan
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    paddingTop: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: getResponsiveSpacing('md'),
  },
  backText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
  },
  infoContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  infoTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  infoText: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  authWarning: {
    padding: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  testButton: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  resultContainer: {
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resultTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  statusContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  statusItem: {
    padding: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
    alignItems: 'center',
  },
  statusText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  detailTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  detailText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  errorsContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  warningsContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  warningText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  issuesContainer: {
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  issueText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  recommendationsContainer: {
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  recommendationText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  helpContainer: {
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  helpTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  helpText: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
}); 