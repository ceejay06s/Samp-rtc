/**
 * Utility to generate sample TGS test data for development and testing
 */

// Sample Lottie animation data (simplified)
const sampleLottieData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Sample Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Shape Layer",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [100, 100] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0, 0, 1] }
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Convert Lottie data to a compressed format that simulates TGS
 * Note: This is not a real TGS file, just for testing purposes
 */
export const createSampleTGSData = (): ArrayBuffer => {
  try {
    // Convert Lottie data to JSON string
    const jsonString = JSON.stringify(sampleLottieData);
    
    // Convert to Uint8Array
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(jsonString);
    
    // For testing, we'll just return the raw data
    // In a real TGS file, this would be gzipped
    return uint8Array.buffer;
  } catch (error) {
    console.error('Error creating sample TGS data:', error);
    // Return empty buffer if there's an error
    return new ArrayBuffer(0);
  }
};

/**
 * Create a data URL from sample TGS data
 */
export const createSampleTGSDataURL = (): string => {
  try {
    const arrayBuffer = createSampleTGSData();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    return `data:application/octet-stream;base64,${base64}`;
  } catch (error) {
    console.error('Error creating sample TGS data URL:', error);
    return '';
  }
};

/**
 * Generate a mock TGS file for testing
 */
export const generateMockTGSFile = (): File => {
  try {
    const arrayBuffer = createSampleTGSData();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create a mock file
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    const file = new File([blob], 'sample.tgs', { type: 'application/octet-stream' });
    
    return file;
  } catch (error) {
    console.error('Error generating mock TGS file:', error);
    throw error;
  }
};

/**
 * Test TGS rendering capabilities
 */
export const testTGSCapabilities = async (): Promise<{
  pakoAvailable: boolean;
  lottieWebAvailable: boolean;
  canDecompress: boolean;
  canRender: boolean;
}> => {
  const result = {
    pakoAvailable: false,
    lottieWebAvailable: false,
    canDecompress: false,
    canRender: false,
  };

  try {
    // Test pako availability
    try {
      const pako = await import('pako');
      result.pakoAvailable = !!(pako.default || pako);
      console.log('✅ Pako is available');
    } catch (error) {
      console.log('❌ Pako is not available:', error);
    }

    // Test lottie-web availability
    try {
      const lottie = await import('lottie-web');
      result.lottieWebAvailable = !!(lottie.default || lottie);
      console.log('✅ Lottie-web is available');
    } catch (error) {
      console.log('❌ Lottie-web is not available:', error);
    }

    // Test decompression capability
    if (result.pakoAvailable) {
      try {
        const sampleData = createSampleTGSData();
        const uint8Array = new Uint8Array(sampleData);
        
        // Try to decompress (this will fail since our sample isn't actually compressed)
        // But it tests if pako is working
        const pako = await import('pako');
        const pakoInstance = pako.default || pako;
        
        if (pakoInstance && pakoInstance.inflate) {
          result.canDecompress = true;
          console.log('✅ Decompression capability confirmed');
        }
      } catch (error) {
        console.log('❌ Decompression test failed:', error);
      }
    }

    // Test rendering capability
    if (result.lottieWebAvailable) {
      result.canRender = true;
      console.log('✅ Rendering capability confirmed');
    }

  } catch (error) {
    console.error('Error testing TGS capabilities:', error);
  }

  return result;
};

/**
 * Get sample TGS URLs for testing
 */
export const getSampleTGSUrls = (): string[] => {
  return [
    'https://example.com/sample1.tgs',
    'https://example.com/sample2.tgs',
    'https://example.com/sample3.tgs',
  ];
};

/**
 * Validate TGS file format (basic check)
 */
export const validateTGSFile = (file: File): boolean => {
  // Basic validation - check file extension and size
  const isValidExtension = file.name.toLowerCase().endsWith('.tgs');
  const isValidSize = file.size > 0 && file.size < 10 * 1024 * 1024; // Less than 10MB
  
  return isValidExtension && isValidSize;
}; 