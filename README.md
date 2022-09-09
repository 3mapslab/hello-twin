# Digital Twin for Monitoring Containerized Hazmat Cargo in Port Areas

2022 17th Iberian Conference on Information Systems and Technologies (CISTI): https://ieeexplore.ieee.org/document/9820434

The complexity of the number of stakeholders, information systems used, and port operations evoke new challenges to port security when it comes to the total knowledge and control of the overall operations of transport and parking of containerized freight, namely hazmat ones.The rising interest and the port authorities' awareness of the relevance of security concerns involved in this complex ecosystem has led to the search for new technological solutions that allow, in an integrated manner, the smart and automatic control of operations of transport and hazardous freight parking in all the areas of its jurisdiction, without third-party dependencies.Despite its importance and criticality, port authorities tend to have limited real-time knowledge of the location of hazmat containers, whether moving within the port (entering and leaving), or in its parking, having a direct impact on the port security.This article presents a Digital Twin platform for 3D and real-time georeferenced visualization of container parks and the location of hazardous containerized freight. This tool combines different modules that further allow to visualize information associated to a container, its movement, as well as its surrounding area, including a realistic and dynamic 3D representation of what is the area encircling the port.

![PortoLeixões2](https://user-images.githubusercontent.com/47954852/189256946-d239791c-f551-487e-9613-4cf31af5eab2.png)

## Setup

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

### Hello-Twin Setup
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
