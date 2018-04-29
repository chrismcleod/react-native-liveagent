import React from 'react';
import { Button, SafeAreaView } from 'react-native';
import Config from 'react-native-config';

import { Liveagent } from './liveagent';

const config = {
  buttonId: Config.BUTTON_ID,
  deploymentId: Config.DEPLOYMENT_ID,
  host: Config.HOST,
  organizationId: Config.ORGANIZATION_ID,
  version: Config.VERSION,
};

const prechat = {
  language: 'en',
  userAgent: 'Test',
  visitorName: 'Zach Zachary',
  prechatDetails: [],
  prechatEntities: [],
  receiveQueueUpdates: true,
  screenResolution: '1900x1200',
  isPost: true,
};

export class App extends React.Component {

  liveagent = React.createRef<Liveagent>();

  state = { mount: false };

  render() {
    return (
      <SafeAreaView style={ { flex: 1 } }>
        { this.state.mount === false && <Button onPress={ () => this.setState({ mount: true }) } title='Mount' /> }
        { this.state.mount === true && <Button onPress={ () => this.setState({ mount: false }) } title='Unmount' /> }
        { this.state.mount &&
          <React.Fragment>
            <Button onPress={ () => this.liveagent.current ? this.liveagent.current.startChat() : () => undefined } title='Start Chat' />
            <Liveagent
              ref={ this.liveagent }
              prechat={ prechat }
              config={ config }
              onChatEnded={ console.log }
            />
          </React.Fragment>
        }
      </SafeAreaView>
    );
  }
}
