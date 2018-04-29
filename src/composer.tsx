import React from 'react';
import { StyleProp, TextInput, TextStyle } from 'react-native';
import { Composer as GiftedComposer, ComposerProps } from 'react-native-gifted-chat';

import * as style from './style';
export interface ComposerProperties extends ComposerProps {
  disabled?: boolean;
  composerStyle?: StyleProp<TextStyle>;
}

export class Composer extends React.Component<ComposerProperties> {

  render() {
    return (
      this.props.disabled ? (
        <TextInput
          placeholder='The chat has ended'
          editable={ false }
          selectTextOnFocus={ false }
          style={ [ style.disabledComposer, this.props.composerStyle, { height: this.props.composerHeight } ] }
        />
      ) : (
          <GiftedComposer { ...this.props } />
        )
    );
  }
}
