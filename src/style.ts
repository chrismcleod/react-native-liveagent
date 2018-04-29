import { Platform, TextStyle, ViewStyle } from 'react-native';

export const agentTyping: TextStyle = {
  color: 'rgba(0,0,0,0.4)',
  fontSize: 12,
  fontStyle: 'italic',
};

export const footerContainer: ViewStyle = {
  padding: 8,
};

export const unavailableContainer: ViewStyle = {
  alignItems: 'center', justifyContent: 'center',
  flex: 1,
  padding: 30,
};

export const unavailableText: TextStyle = {
  textAlign: 'center',
};

export const disabledComposer: TextStyle = {
  backgroundColor: 'rgba(0,0,0,0.1)',
  borderRadius: 4,
  flex: 1,
  fontSize: 16,
  lineHeight: 16,
  paddingHorizontal: 5,
  marginHorizontal: 10,
  marginTop: Platform.select({
    ios: 6,
    android: 0,
  }),
  marginBottom: Platform.select({
    ios: 5,
    android: 3,
  }),
};
