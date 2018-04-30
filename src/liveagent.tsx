import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { GiftedChat, GiftedChatProps, IChatMessage, IMessage, User } from 'react-native-gifted-chat';
import { LiveagentConfig, LiveagentSession, Messages, Requests, startSession } from 'rx-sfliveagent-client';
import { v4 } from 'uuid';

import { Composer } from './composer';
import * as style from './style';
import { Subscription } from 'rxjs';

export interface LiveagentProperties extends GiftedChatProps {
  config: LiveagentConfig;
  prechat: Requests.ChasitorInit;
  onChatEnded?: (reason: 'user' | 'agent') => any;
  onChatError?: (error?: Error) => any;
  Unavailable?: React.ComponentType;
  strings?: {
    agentTyping?: (agent: User) => string;
    userQueued?: (position: number) => string;
    queueUpdate?: (position: number) => string;
    unavailable?: () => string;
    chatEnded?: (reason: 'agent' | 'user') => string;
  };
  styles?: {
    agentTypingText?: StyleProp<TextStyle>;
    footerContainer?: StyleProp<ViewStyle>;
    composer?: StyleProp<TextStyle>;
  };
}

export interface LiveagentState {
  available: boolean;
  messages: IMessage[];
  text: string;
  user?: User;
  agent: User;
  agentTyping: boolean;
  ended: boolean;
}

export class Liveagent extends React.Component<LiveagentProperties, LiveagentState> {

  static defaultProps: Partial<LiveagentProperties> = {
    styles: {},
    strings: {
      unavailable: () => 'There are currently no agents available to handle your request, please try again later',
      chatEnded: (reason: 'agent' | 'user') => reason === 'agent' ? 'The agent has ended the chat' : 'You have ended the chat',
      agentTyping: agent => `${agent.name} is typing...`,
      userQueued: (position) => {
        const phrasing = position === 1 ? 'is one person' : `are ${position} people`;
        return `There ${phrasing} ahead of you.  An agent will be with you shortly, thank you for your patience.`;
      },
      queueUpdate: position => `Your current queue position is now ${position}`,
    },
  };

  public session?: LiveagentSession;
  public state: LiveagentState = {
    available: true,
    ended: false,
    messages: [],
    text: '',
    agentTyping: false,
    agent: { _id: '1', name: 'Agent' },
  };

  private notTypingTimer: any;
  private isTyping: boolean = false;
  private queuedTimer: any;
  private unmounting: boolean = false;
  private subscriptions: Subscription[] = [];

  componentWillUnmount() {
    this.unmounting = true;
    clearTimeout(this.queuedTimer);
    if (this.session) this.session.api.chatEnd();
  }

  render() {

    if (this.state.available === false) {
      return this.props.Unavailable ? <this.props.Unavailable /> : (
        <View style={ style.unavailableContainer }>
          <Text style={ style.unavailableText }>{ this.string('unavailable') }</Text>
        </View>
      );
    }

    if (this.state.user) {
      return (
        <GiftedChat
          { ...this.props }
          messages={ this.state.messages }
          onSend={ this.sendMessage }
          user={ this.state.user }
          onInputTextChanged={ this.onChangeText }
          renderChatFooter={ this.Footer }
          renderComposer={ ((props: any) => <Composer { ...props } disabled={ this.state.ended } composerStyle={ this.props.styles!.composer } />) as any }
        />
      );
    }

    return null;
  }

  Footer = () => {
    return (
      <View style={ this.props.styles!.footerContainer || style.footerContainer }>
        { this.state.agentTyping &&
          <Text style={ this.props.styles!.agentTypingText || style.agentTyping }>
            { this.string('agentTyping', this.state.agent) }
          </Text>
        }
      </View>
    );
  }

  startChat() {
    this.setState({ messages: [], text: '' });
    if (this.session) this.session.api.chatEnd();
    this.session = startSession(this.props.config, this.props.prechat);
    this.subscriptions.push(this.session.chatEstablished$.subscribe(this.onChatEstablished));
    this.subscriptions.push(this.session.chatRequestSuccess$.subscribe(this.onChatRequestSuccess));
    this.subscriptions.push(this.session.chatRequestFail$.subscribe(this.onChatRequestFail));
    this.subscriptions.push(this.session.chatMessage$.subscribe(this.onMessage));
    this.subscriptions.push(this.session.chasitorChatMessage$.subscribe(this.onMessage));
    this.subscriptions.push(this.session.agentTyping$.subscribe(() => this.onAgentTyping(true)));
    this.subscriptions.push(this.session.agentNotTyping$.subscribe(() => this.onAgentTyping(false)));
    this.subscriptions.push(this.session.chatEnd$.subscribe(() => this.onChatEnded('user')));
    this.subscriptions.push(this.session.chatEnded$.subscribe(() => this.onChatEnded('agent')));
    this.subscriptions.push(this.session.queueUpdate$.subscribe(this.onQueueUpdate));
    this.subscriptions.push(this.session.error$.subscribe(error => this.props.onChatError && this.props.onChatError(error)));
  }

  endChat() {
    if (this.session) this.session.api.chatEnd();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addSystemMessage = (text: string) => {
    const message: any = {
      text,
      _id: v4(),
      createdAt: new Date(),
      system: true,
    };
    const nextMessages: IMessage[] = [ message ];
    this.setState(previousState => ({ messages: nextMessages.concat(previousState.messages) }));
  }

  private onChatRequestSuccess = (event: Messages.ChatRequestSuccess) => {
    this.setState({
      user: {
        _id: this.session!.api.visitor.id,
        name: this.session!.api.visitor.name,
      },
    }, () => {
      if (event.message.queuePosition > 0) {
        this.queuedTimer = setTimeout(() => this.addSystemMessage(this.string('userQueued', event.message.queuePosition)), 2000);
      }
    });
  }

  private onChatRequestFail = (event: Messages.ChatRequestFail) => {
    this.onChatEnded('agent');
    if (event.message.reason === 'Unavailable') this.setState({ available: false });
  }

  private onChatEstablished = (event: Messages.ChatEstablished) => {
    clearTimeout(this.queuedTimer);
    this.setState({
      messages: this.state.messages.filter((msg: any) => !msg.system),
      agent: {
        _id: event.message.userId,
        name: event.message.name,
      },
    });
  }

  private onMessage = (event: Messages.ChasitorChatMessage | Messages.ChatMessage) => {
    const message: IChatMessage = {
      _id: v4(),
      createdAt: new Date(),
      text: event.message.text,
      user: {
        _id: event.message.agentId,
        name: event.message.name,
        avatar: '',
      },
    };
    const nextMessages: IMessage[] = [ message ];
    let agentTyping: Maybe<boolean> = undefined;
    if (event.message.agentId === this.state.agent._id) {
      agentTyping = false;
    } else {
      agentTyping = this.state.agentTyping;
    }
    this.setState(previousState => ({ agentTyping: !!agentTyping, messages: nextMessages.concat(previousState.messages) }));
  }

  private onChangeText = (text: string) => {
    if (this.session) {
      clearTimeout(this.notTypingTimer);
      if (this.isTyping === false) this.session.api.chasitorTyping();
      this.isTyping = true;
      this.notTypingTimer = setTimeout(() => {
        this.isTyping = false;
        this.session!.api.chasitorNotTyping();
      }, 2000);
    }
    if (this.props.onInputTextChanged) this.props.onInputTextChanged(text);
  }

  private onAgentTyping = (agentTyping: boolean) => {
    this.setState({ agentTyping });
  }

  private onQueueUpdate = (event: Messages.QueueUpdate) => {
    if (event.message.position > 0) {
      this.addSystemMessage(this.string('queueUpdate', event.message.position));
    }
  }

  private onChatEnded = (reason: 'user' | 'agent') => {
    if (this.unmounting === false) {
      this.addSystemMessage(this.string('chatEnded', reason));
      this.setState({ ended: true });
    }
    if (this.props.onChatEnded) this.props.onChatEnded(reason);
  }

  private sendMessage = (messages: any[]) => {
    if (this.session) {
      this.session.api.chatMessage({
        text: messages[ 0 ].text,
      });
      this.setState({ text: '' });
    }
    if (this.props.onSend) this.props.onSend(messages);
  }

  private string = (name: string, ...args: any[]): string => {
    if ((this.props.strings as any)![ name ]) return (this.props.strings! as any)[ name ](...args);
    return '';
  }

}
