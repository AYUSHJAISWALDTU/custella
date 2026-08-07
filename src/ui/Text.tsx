import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, type ColorToken, type as typeScale, type TypeToken } from './tokens';

export type TextProps = RNTextProps & {
  variant?: TypeToken;
  color?: ColorToken;
  center?: boolean;
};

/**
 * The only text component in the app. Using RN's <Text> directly is a lint error —
 * it's how off-scale font sizes and stray greys creep in.
 */
export function Text({
  variant = 'body',
  color = 'text',
  center = false,
  style,
  ...rest
}: TextProps) {
  const scale = typeScale[variant] as TextStyle;
  return (
    <RNText
      style={[scale, { color: colors[color] }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
