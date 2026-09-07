import type { ReactNode } from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { useHaptics } from "../../hooks/useHaptics";
interface Props {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  style?: ViewStyle;
  accessibilityLabel?: string;
}
const variants: Record<string, ViewStyle> = {
  primary: { backgroundColor: "#a9630b" },
  secondary: {
    backgroundColor: "#243244",
    borderWidth: 1,
    borderColor: "#718096",
  },
  danger: { backgroundColor: "#b91c1c" },
  ghost: { backgroundColor: "transparent" },
};
export function PressableButton({
  children,
  onPress,
  disabled = false,
  variant = "primary",
  style,
  accessibilityLabel,
}: Props) {
  const { onButtonPress } = useHaptics();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void onButtonPress();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        variants[variant],
        style,
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
