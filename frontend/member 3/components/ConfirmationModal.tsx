import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { staffTheme } from '../theme/staffTheme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={[styles.iconContainer, isDestructive ? styles.iconDestructive : styles.iconInfo]}>
            <Text style={styles.iconText}>{isDestructive ? '⚠️' : 'ℹ️'}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                isDestructive ? styles.confirmDestructiveButton : styles.confirmPrimaryButton,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator color={staffTheme.white} size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: staffTheme.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconDestructive: {
    backgroundColor: staffTheme.paleRed,
  },
  iconInfo: {
    backgroundColor: staffTheme.paleBlue,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    color: staffTheme.ink,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: staffTheme.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: staffTheme.canvas,
  },
  cancelText: {
    color: staffTheme.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmPrimaryButton: {
    backgroundColor: staffTheme.navy,
  },
  confirmDestructiveButton: {
    backgroundColor: staffTheme.red,
  },
  confirmText: {
    color: staffTheme.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
