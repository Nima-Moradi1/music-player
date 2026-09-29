import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type TextProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import {tokens} from '../tokens';
import {useTheme} from '../theme';
import {Icon, type IconName} from '../icons';
type TextKind = 'body' | 'caption' | 'label' | 'title' | 'heading' | 'display';
export function Text({
  kind = 'body',
  muted = false,
  style,
  ...props
}: TextProps & {kind?: TextKind; muted?: boolean}) {
  const {colors, rtl} = useTheme();
  return (
    <NativeText
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.text,
          fontSize: tokens.typography[kind],
          fontWeight: ['heading', 'display', 'title'].includes(kind) ? '600' : '400',
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        style,
      ]}
    />
  );
}
export function Surface({
  children,
  variant = 'standard',
  style,
}: React.PropsWithChildren<{
  variant?: 'subtle' | 'standard' | 'elevated' | 'modal' | 'player';
  style?: StyleProp<ViewStyle>;
}>) {
  const {colors, solid} = useTheme();
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: solid ? colors.surface : colors.glass,
          borderColor: colors.border,
          borderRadius: variant === 'modal' ? tokens.radius.sheet : tokens.radius.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Row({children, style}: React.PropsWithChildren<{style?: StyleProp<ViewStyle>}>) {
  const {rtl} = useTheme();
  return (
    <View style={[styles.row, {flexDirection: rtl ? 'row-reverse' : 'row'}, style]}>
      {children}
    </View>
  );
}
export function Toggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const {rtl} = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{checked: value}}
      onPress={() => onValueChange(!value)}
      style={[styles.row, styles.toggle, {flexDirection: rtl ? 'row-reverse' : 'row'}]}
    >
      <View style={styles.fill}>
        <Text>{label}</Text>
      </View>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Switch accessible={false} value={value} />
      </View>
    </Pressable>
  );
}
export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const {colors, rtl} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.elevated : colors.accent,
          flexDirection: rtl ? 'row-reverse' : 'row',
          opacity: disabled ? tokens.opacity.disabled : pressed ? tokens.opacity.muted : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} color={secondary ? colors.text : colors.onAccent} />}
      <Text
        kind="label"
        style={{
          color: secondary ? colors.text : colors.onAccent,
          fontWeight: '600',
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  selected = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      style={[styles.iconButton, {backgroundColor: selected ? colors.elevated : 'transparent'}]}
    >
      <Icon name={name} color={selected ? colors.accent : colors.text} />
    </Pressable>
  );
}
export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  autoFocus = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label: string;
  autoFocus?: boolean;
}) {
  const {colors, rtl} = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      accessibilityLabel={label}
      autoFocus={autoFocus}
      placeholderTextColor={colors.muted}
      selectionColor={colors.accent}
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.elevated,
          textAlign: rtl ? 'right' : 'left',
        },
      ]}
    />
  );
}
export function Page({children, scroll = true}: React.PropsWithChildren<{scroll?: boolean}>) {
  const {colors} = useTheme();
  return (
    <View style={[styles.page, {backgroundColor: colors.background}]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.pageContent, styles.fill]}>{children}</View>
      )}
    </View>
  );
}
export function EmptyState({
  title,
  body,
  action,
  icon = 'music',
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: IconName;
}) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={tokens.size.artwork} />
      <Text kind="title">{title}</Text>
      <Text muted>{body}</Text>
      {action}
    </View>
  );
}
export function Loading({label}: {label: string}) {
  const {colors} = useTheme();
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.accent} />
      <Text muted>{label}</Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  fill: {flex: 1},
  surface: {
    padding: tokens.spacing.xl,
    borderWidth: tokens.surface.border,
    gap: tokens.spacing.md,
  },
  row: {alignItems: 'center', gap: tokens.spacing.md},
  toggle: {minHeight: tokens.size.touch, justifyContent: 'space-between'},
  button: {
    minHeight: tokens.size.touch,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
  },
  iconButton: {
    minHeight: tokens.size.touch,
    minWidth: tokens.size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.pill,
  },
  input: {
    minHeight: tokens.size.touch,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    fontSize: tokens.typography.body,
    borderRadius: tokens.radius.small,
  },
  page: {flex: 1},
  pageContent: {
    width: '100%',
    maxWidth: tokens.size.page,
    alignSelf: 'center',
    padding: tokens.spacing.xl,
    gap: tokens.spacing.xl,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.hero,
    gap: tokens.spacing.lg,
  },
});
