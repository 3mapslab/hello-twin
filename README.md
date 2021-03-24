# hello-twin

### Clone Geojson-Tile-Server
Clone and setup the repository [Geojson Tile Server](https://github.com/TNOCS/geojson-tile-server)

Extract **data.zip** in this repository to directory **geojson-tile-server/data**

Run with:
```
npm start
```
### Containers Simulation Setup
Clone and setup [tos-simulator](https://github.com/triedeti/tos-simulator-socket)

Run with:
```
node main.js
```
## Hello-Twin Setup
```
npm install
```
### Compiles and hot-reloads for development
```
npm run serve
```

### Test 3D Tiles
Download [NY Tileset](https://s3.amazonaws.com/cesiumjs/3DTiles/NewYork.zip),
extract and place **NewYork** folder on this repository's public folder.

### Twin Initialization

When initializing Hello-Twin, the initial position of the world and development url must be sent in the configs object.

Example: 
```
const configs = {
   initialPosition: {
      lat: 41.185523935676713,
      lng: -8.7016652234108349
   },
   url: 'http://localhost:8123/'
};

let twin = new TwinView(canvas, configs);
```
