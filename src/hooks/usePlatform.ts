import { useMemo } from 'react';
import { getBrowserInfo, getEnvironmentConfig, getPlatformInfo, getPlatformStyles } from '../utils/platform';

export const usePlatform = () => {
  const platformInfo = useMemo(() => getPlatformInfo(), []);
  const browserInfo = useMemo(() => getBrowserInfo(), []);
  const environmentConfig = useMemo(() => getEnvironmentConfig(), []);
  const platformStyles = useMemo(() => getPlatformStyles(), []);

  return {
    ...platformInfo,
    browserInfo,
    environmentConfig,
    platformStyles,
  };
}; 