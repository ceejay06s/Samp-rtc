import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface WebAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
}

// Helper function to detect if we're on web
const isWebPlatform = (): boolean => {
  return typeof window !== 'undefined' && window.navigator && Platform.OS === 'web';
};

// Web-compatible alert implementation
const showWebAlert = (options: WebAlertOptions): void => {
  if (typeof window === 'undefined') return;

  const { title, message, buttons = [], cancelable = true } = options;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    animation: modalSlideIn 0.3s ease-out;
  `;

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Create title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
  `;

  // Create message
  const messageElement = document.createElement('p');
  messageElement.textContent = message || '';
  messageElement.style.cssText = `
    margin: 0 0 24px 0;
    font-size: 14px;
    line-height: 1.4;
    color: #666;
  `;

  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;

  // Create buttons
  const createButton = (button: AlertButton, index: number) => {
    const buttonElement = document.createElement('button');
    buttonElement.textContent = button.text;
    buttonElement.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      ${button.style === 'destructive' 
        ? 'background-color: #dc3545; color: white;' 
        : button.style === 'cancel'
        ? 'background-color: #f8f9fa; color: #6c757d; border: 1px solid #dee2e6;'
        : 'background-color: #007bff; color: white;'
      }
    `;

    buttonElement.addEventListener('click', () => {
      if (button.onPress) {
        button.onPress();
      }
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    });

    return buttonElement;
  };

  // Add buttons
  if (buttons.length === 0) {
    const okButton = createButton({ text: 'OK' }, 0);
    buttonsContainer.appendChild(okButton);
  } else {
    buttons.forEach((button, index) => {
      const buttonElement = createButton(button, index);
      buttonsContainer.appendChild(buttonElement);
    });
  }

  // Handle overlay click for cancelable alerts
  if (cancelable) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      }
    });
  }

  // Assemble modal
  modal.appendChild(titleElement);
  if (message) {
    modal.appendChild(messageElement);
  }
  modal.appendChild(buttonsContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus management
  const firstButton = buttonsContainer.querySelector('button') as HTMLButtonElement;
  if (firstButton) {
    firstButton.focus();
  }
};

// Enhanced Alert API that works on both web and mobile
export const WebAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: string
  ): void => {
    if (isWebPlatform()) {
      showWebAlert({
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
        cancelable: true,
      });
    } else {
      // Use native Alert on mobile
      Alert.alert(title, message, buttons, { cancelable: true });
    }
  },

  // Convenience methods
  showSuccess: (title: string, message?: string): void => {
    WebAlert.alert(title, message, [{ text: 'OK' }]);
  },

  showError: (title: string, message?: string): void => {
    WebAlert.alert(title, message, [{ text: 'OK' }]);
  },

  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void => {
    WebAlert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  },

  showDeleteConfirmation: (
    title: string,
    message: string,
    onDelete: () => void,
    onCancel?: () => void
  ): void => {
    WebAlert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  },
};

// Export the showWebAlert function for direct use
export { showWebAlert };
