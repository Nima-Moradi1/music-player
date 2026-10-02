import React, {useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button, IconButton, Row, Text} from '../primitives';
import {tokens} from '../tokens';
import {useTheme} from '../theme';

type OverlayProps = React.PropsWithChildren<{
  visible: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  dismissible?: boolean;
  returnFocusRef?: React.RefObject<View | null>;
}>;

function Overlay({
  visible,
  title,
  closeLabel,
  onClose,
  children,
  dismissible = true,
  returnFocusRef,
  sheet = false,
}: OverlayProps & {sheet?: boolean}) {
  const {colors, reduceMotion} = useTheme();
  const insets = useSafeAreaInsets();
  const heading = useRef<React.ElementRef<typeof Text>>(null);
  function focusTitle() {
    const node = findNodeHandle(heading.current);
    if (node != null) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }
  function restoreFocus() {
    const node = returnFocusRef?.current && findNodeHandle(returnFocusRef.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={reduceMotion ? 'none' : 'fade'}
      onShow={focusTitle}
      onDismiss={restoreFocus}
      onRequestClose={() => {
        if (dismissible) {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, sheet ? styles.bottom : styles.center]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessible={false}
          importantForAccessibility="no"
          onPress={() => dismissible && onClose()}
        />
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          onAccessibilityEscape={() => dismissible && onClose()}
          style={[
            styles.panel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingTop: tokens.spacing.xl,
              paddingBottom: Math.max(insets.bottom, tokens.spacing.xl),
              marginTop: insets.top,
            },
            sheet ? styles.sheet : styles.dialog,
          ]}
        >
          <Row style={styles.heading}>
            <Text ref={heading} accessibilityRole="header" kind="title" style={styles.title}>
              {title}
            </Text>
            {dismissible && <IconButton name="close" label={closeLabel} onPress={onClose} />}
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            style={styles.scroll}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Sheet(props: OverlayProps) {
  return <Overlay {...props} sheet />;
}

export function Dialog({
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  busy = false,
  error,
  ...props
}: Omit<OverlayProps, 'children' | 'closeLabel' | 'dismissible'> & {
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <Overlay {...props} closeLabel={cancelLabel} dismissible={!busy}>
      <Text>{body}</Text>
      {!!error && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
      <Button label={confirmLabel} disabled={busy} onPress={onConfirm} />
      <Button label={cancelLabel} secondary disabled={busy} onPress={props.onClose} />
    </Overlay>
  );
}

export function Toast({
  message,
  dismissLabel,
  onDismiss,
  tone = 'status',
  duration = tokens.feedback.toastDuration,
}: {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
  tone?: 'status' | 'error';
  duration?: number;
}) {
  const {colors} = useTheme();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  useEffect(() => {
    if (!message) {
      return;
    }
    // Android live regions announce changes; iOS needs an explicit announcement.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled().then(screenReader => {
      // Keep feedback available until dismissed for screen-reader users.
      if (active && !screenReader && duration > 0) {
        timer = setTimeout(() => onDismissRef.current(), duration);
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [message, duration]);
  if (!message) {
    return null;
  }
  return (
    <View style={[styles.toast, {backgroundColor: colors.elevated, borderColor: colors.border}]}>
      <Row>
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
          style={[styles.title, {color: tone === 'error' ? colors.danger : colors.text}]}
        >
          {message}
        </Text>
        <IconButton name="close" label={dismissLabel} onPress={onDismiss} />
      </Row>
    </View>
  );
}

export function Skeleton({
  label,
  rows = tokens.feedback.skeletonLines,
}: {
  label: string;
  rows?: number;
}) {
  const {colors} = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{busy: true}}
    >
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        {Array.from({length: Math.min(10, Math.max(1, rows))}, (_, index) => (
          <Row key={index} style={styles.skeletonRow}>
            <View style={[styles.skeletonArtwork, {backgroundColor: colors.elevated}]} />
            <View style={styles.title}>
              <View style={[styles.skeletonLine, {backgroundColor: colors.elevated}]} />
              <View style={[styles.skeletonCaption, {backgroundColor: colors.elevated}]} />
            </View>
          </Row>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: tokens.feedback.overlay},
  center: {justifyContent: 'center', padding: tokens.spacing.xl},
  bottom: {justifyContent: 'flex-end'},
  panel: {
    width: '100%',
    maxWidth: tokens.size.page,
    maxHeight: '90%',
    alignSelf: 'center',
    paddingHorizontal: tokens.spacing.xl,
    borderWidth: tokens.surface.border,
  },
  sheet: {borderTopLeftRadius: tokens.radius.sheet, borderTopRightRadius: tokens.radius.sheet},
  dialog: {borderRadius: tokens.radius.sheet},
  heading: {marginBottom: tokens.spacing.lg},
  title: {flex: 1},
  scroll: {flexGrow: 0, flexShrink: 1},
  content: {gap: tokens.spacing.lg},
  toast: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.small,
    borderWidth: tokens.surface.border,
  },
  skeletonRow: {minHeight: tokens.size.row, gap: tokens.spacing.lg},
  skeletonArtwork: {
    width: tokens.size.artwork,
    height: tokens.size.artwork,
    borderRadius: tokens.radius.small,
  },
  skeletonLine: {
    height: tokens.typography.body,
    borderRadius: tokens.radius.small,
    marginBottom: tokens.spacing.sm,
  },
  skeletonCaption: {
    height: tokens.typography.caption,
    width: '60%',
    borderRadius: tokens.radius.small,
  },
});
