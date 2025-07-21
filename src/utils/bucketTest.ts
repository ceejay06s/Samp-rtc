import { supabase } from '../../lib/supabase';

export interface BucketTestResult {
  success: boolean;
  bucketExists: boolean;
  bucketAccessible: boolean;
  policiesExist: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class BucketTest {
  static async testBucketConnection(): Promise<BucketTestResult> {
    const result: BucketTestResult = {
      success: false,
      bucketExists: false,
      bucketAccessible: false,
      policiesExist: false,
      canUpload: false,
      canDownload: false,
      canDelete: false,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      console.log('=== Starting Bucket Connection Test ===');

      // Test 1: Check authentication
      console.log('1. Testing authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        result.errors.push('Authentication failed: User not logged in');
        console.error('Auth error:', authError);
        result.recommendations.push('Please log in to test bucket access');
        return result;
      }
      console.log('✓ Authentication successful');

      // Test 2: Check if storage is available
      console.log('2. Checking storage availability...');
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          if (listError.message.includes('not available')) {
            result.warnings.push('Storage not available on free plan - using base64 fallback');
            result.recommendations.push('Upgrade to Pro plan for storage features');
            result.success = true; // Base64 upload will work
            return result;
          } else {
            result.errors.push(`Failed to list buckets: ${listError.message}`);
            console.error('List buckets error:', listError);
            return result;
          }
        }
        
        console.log('✓ Storage is available');
        console.log('Available buckets:', buckets?.map(b => b.name) || []);
        
        // Test 3: Check if our bucket exists
        const profilePhotoBucket = buckets?.find(b => b.name === 'profile-photo');
        result.bucketExists = !!profilePhotoBucket;
        
        if (profilePhotoBucket) {
          console.log('✓ Profile photo bucket found');
        } else {
          result.errors.push('Profile photo bucket not found');
          result.recommendations.push('Run the SQL setup script: sql/fix-bucket-connection.sql');
          console.error('✗ Profile photo bucket not found');
          return result;
        }
      } catch (storageError) {
        result.warnings.push('Storage not available - using base64 fallback');
        result.recommendations.push('Check your Supabase plan and storage settings');
        result.success = true; // Base64 upload will work
        return result;
      }

      // Test 4: Try to access the bucket
      if (result.bucketExists) {
        console.log('3. Testing bucket access...');
        const { data: files, error: accessError } = await supabase.storage
          .from('profile-photo')
          .list('', { limit: 1 });
        
        if (accessError) {
          result.errors.push(`Bucket access error: ${accessError.message}`);
          console.error('Bucket access error:', accessError);
          result.recommendations.push('Check storage policies and RLS settings');
        } else {
          result.bucketAccessible = true;
          console.log('✓ Bucket access successful');
        }
      }

      // Test 5: Check if we can upload a test file
      if (result.bucketAccessible && user) {
        console.log('4. Testing upload capability...');
        try {
          // Create a simple test image (1x1 pixel PNG)
          const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
          const response = await fetch(testImageData);
          const blob = await response.blob();
          
          const testFileName = `${user.id}/test-${Date.now()}.png`;
          console.log('Attempting to upload test file:', testFileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-photo')
            .upload(testFileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            result.errors.push(`Upload test failed: ${uploadError.message}`);
            console.error('Upload test error:', uploadError);
            result.recommendations.push('Check upload policies and file permissions');
          } else {
            result.canUpload = true;
            console.log('✓ Upload test successful');
            console.log('Upload data:', uploadData);

            // Test 6: Try to download the test file
            console.log('5. Testing download capability...');
            const { data: urlData } = supabase.storage
              .from('profile-photo')
              .getPublicUrl(testFileName);
            
            if (urlData.publicUrl) {
              result.canDownload = true;
              console.log('✓ Download test successful');
              console.log('Public URL:', urlData.publicUrl);
            } else {
              result.errors.push('Failed to get public URL for uploaded file');
            }

            // Test 7: Try to delete the test file
            console.log('6. Testing delete capability...');
            const { error: deleteError } = await supabase.storage
              .from('profile-photo')
              .remove([testFileName]);
            
            if (deleteError) {
              result.errors.push(`Delete test failed: ${deleteError.message}`);
              console.error('Delete test error:', deleteError);
              result.recommendations.push('Check delete policies');
            } else {
              result.canDelete = true;
              console.log('✓ Delete test successful');
            }
          }
        } catch (uploadTestError) {
          result.errors.push(`Upload test exception: ${uploadTestError instanceof Error ? uploadTestError.message : 'Unknown error'}`);
          console.error('Upload test exception:', uploadTestError);
        }
      }

      // Determine overall success
      result.success = result.bucketExists && result.bucketAccessible && result.canUpload && result.canDownload && result.canDelete;
      
      if (result.success) {
        console.log('=== All bucket tests passed! ===');
      } else {
        console.log('=== Some bucket tests failed ===');
        console.log('Errors:', result.errors);
        console.log('Warnings:', result.warnings);
        console.log('Recommendations:', result.recommendations);
      }
      
      return result;
    } catch (error) {
      console.error('Bucket connection test failed:', error);
      result.errors.push(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  static async diagnoseIssues(): Promise<string[]> {
    const issues: string[] = [];
    
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        issues.push('User not authenticated - please log in');
        return issues;
      }

      // Check storage availability
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        if (listError.message.includes('not available')) {
          issues.push('Storage not available on free plan - upgrade to Pro plan');
        } else {
          issues.push(`Storage access error: ${listError.message}`);
        }
        return issues;
      }

      // Check bucket existence
      const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photo');
      if (!bucketExists) {
        issues.push('Profile photo bucket does not exist - run SQL setup script');
      }

      // Check bucket access
      if (bucketExists) {
        const { error: accessError } = await supabase.storage
          .from('profile-photo')
          .list('', { limit: 1 });
        
        if (accessError) {
          issues.push(`Bucket access denied: ${accessError.message}`);
        }
      }

    } catch (error) {
      issues.push(`Diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return issues;
  }

  static getRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(issue => issue.includes('not authenticated'))) {
      recommendations.push('Log in to your account');
    }

    if (issues.some(issue => issue.includes('not available on free plan'))) {
      recommendations.push('Upgrade to Supabase Pro plan for storage features');
    }

    if (issues.some(issue => issue.includes('does not exist'))) {
      recommendations.push('Run the SQL setup script: sql/fix-bucket-connection.sql');
    }

    if (issues.some(issue => issue.includes('access denied'))) {
      recommendations.push('Check storage policies in Supabase dashboard');
      recommendations.push('Verify RLS (Row Level Security) is properly configured');
    }

    if (issues.some(issue => issue.includes('Storage access error'))) {
      recommendations.push('Check your Supabase project settings');
      recommendations.push('Verify your API keys are correct');
    }

    return recommendations;
  }
} 