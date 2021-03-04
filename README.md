# hello-twin

### Clone Geojson-Tile-Server
```
Clone and setup this repository:
https://github.com/TNOCS/geojson-tile-server

Extract data.zip from hello-twin to directory /geojson-tile-server/data

Run with:
npm start
```
### Containers Simulation Setup
```
Clone and setup this repository:
https://github.com/triedeti/tos-simulator-socket

Run with:
node main.js
```
## Hello-Twin Project setup
```
npm install
```
### Compiles and hot-reloads for development
```
npm run serve
```
### Configs
```
In file HelloTwin.vue, in configs var, its necessary to define the initial position.

Constructor example: 
const configs = {
   initialPosition: { lat: 41.185523935676713, lng: -8.7016652234108349 },
};
```
