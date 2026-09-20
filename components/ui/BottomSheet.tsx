import React, { type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/constants/theme';
import { runAfterKeyboardHidden } from '@/utils/keyboard';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  maxHeight?: `${number}%` | number;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  maxHeight = '85%',
}: BottomSheetProps) {
  const close = () => runAfterKeyboardHidden(onClose);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          Keyboard.dismiss();
          close();
        }}
      >
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.kav}
        >
          <Pressable
            style={[styles.sheet, { maxHeight }, sheetStyle]}
            onPress={(e) => e.stopPropagation()}
          >
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: theme.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
});
