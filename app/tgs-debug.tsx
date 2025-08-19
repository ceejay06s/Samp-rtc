import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../src/utils/themes';

export default function TGSDebugScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        TGS Debug Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Testing TGSRendererV3 component...
      </Text>

      <View style={styles.rendererContainer}>
        <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
          TGS Renderer Status:
        </Text>
        
        <TGSRendererV3
          url="https://example.com/test.tgs"
          width={200}
          height={200}
          autoPlay={false}
          loop={false}
        />
      </View>

      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Debug Information
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Component should render above{'\n'}
          • Check console for TGS loading logs{'\n'}
          • If you see "TGS File" text, component is working{'\n'}
          • If you see an error, check the console
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  rendererContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxWidth: 400,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 