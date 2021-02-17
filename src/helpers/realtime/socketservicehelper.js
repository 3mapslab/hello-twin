import io from 'socket.io-client';
const URL = process.env.VUE_APP_REALTIME_URL || '';

//The channels to subscribe for realtime updates
const CONTAINERS_CHANNEL = "containers";

export default class SocketServiceHelper {

  static deInitialize() {
    if (SocketServiceHelper._connection) {
      SocketServiceHelper._connection.off('connect');
      SocketServiceHelper._connection.off('disconnect');
      SocketServiceHelper._connection.off('error');
      SocketServiceHelper._connection.disconnect();
      SocketServiceHelper._connection = null;
    }
  }

  static initialize() {
    if (!SocketServiceHelper._connection) {
      console.warn("SocketServiceHelper with URL: ", URL);
      SocketServiceHelper._connection = io(URL);
      SocketServiceHelper._connection.on('connect', function () {
        console.warn("Subscribe channel");
        SocketServiceHelper._connection.emit('subscribeChannel', {
          channel: CONTAINERS_CHANNEL,
        });
      });
      SocketServiceHelper._connection.on('disconnect', function (e) {
        console.warn("disconnect channel", e);
       });
      SocketServiceHelper._connection.on('error', (error) => {
        console.log("Error occurred connecting to socket", error);
      });

      SocketServiceHelper._connection.on(CONTAINERS_CHANNEL, function (message) {
        if (message) {
          console.warn("Container message", message);
        }
      });
    }
  }
}
