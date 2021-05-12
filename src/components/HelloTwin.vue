<template>
  <div>
    <canvas ref="world"></canvas>
    <Stats />
  </div>
</template>

<script>
import TwinView from "@/digitaltwin/TwinView";
import Stats from "./Stats";
import SocketServiceHelper from "../helpers/realtime/socketservicehelper";

const COORDS = {
  "bom-jesus-do-monte": { lat: 41.5546580189999, lng: -8.377735018730164 },
  "matosinhos": { lat: 41.185523935676713, lng: -8.7016652234108349 }
}

const mooringBitsProperties = {
  depth: 0.1,
  altitude: -1,
  material: {
    color: "#ffffff",
    texture: "./plainroof.jpg",
  },
  model: "./cabeco.json",
};

const buildingsProperties = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#ff0000",
    textureTop: "./plainroof.jpg",
    textureSide: "./building.png",
  },
};

const roadsProperties = {
  depth: 0.2,
  altitude: 0.2,
  material: {
    color: "#000000",
  },
};

const gardensProperties = {
  depth: 0.2,
  altitude: 0.1,
  material: {
    color: "#32CD32",
    textureTop: "./garden.jpg",
    textureSide: "./garden.jpg"
  },
};

const parkProperties = {
  depth: 0.2,
  altitude: 0.1,
  material: {
    color: "#6B6B6B",
  },
};

const treesPropertiesTop = {
  depth: 0.1,
  altitude: 2.0,
  model: "./tree_copa.json",
  material: {
    color: "#006400",
  },
};

const treesPropertiesBottom = {
  depth: 0.1,
  altitude: 2.0,
  model: "./tree_tronco.json",
  material: {
    color: "#8B4513",
  },
};

const layerProperties = [
  {
    url: "buildings",
    properties: buildingsProperties,
    type: "MERGED",
  },
  {
    url: "gardens_v2",
    properties: gardensProperties,
    type: "MERGED",
  },
  {
    url: "mooring_bitt",
    properties: mooringBitsProperties,
    type: "INSTANCED",
  },
  {
    url: "roads_v2",
    properties: roadsProperties,
    type: "MERGED",
  },
  {
    url: "parks_v2",
    properties: parkProperties,
    type: "MERGED",
  },
  {
    url: "elementos_arboreos",
    properties: treesPropertiesBottom,
    type: "INSTANCED",
  },
  {
    url: "elementos_arboreos",
    properties: treesPropertiesTop,
    type: "INSTANCED",
  },
];

export default {
  components: {
    Stats,
  },
  data() {
    return {
      twinView: null,
    };
  },
  async mounted() {
    const configs = {
      initialPosition: COORDS['matosinhos'],
      url: 'http://localhost:8123/',
      activateContainers: true,
      //tileset: "./bom-jesus-do-monte/BomJesus_Model/BatchedBomJesusCleanedUp/tileset.json"
    };
    this.twinView = new TwinView(this.$refs.world, configs, layerProperties);

    // TODO - Receive coordinates on initial loading
    this.twinView.loadSingleObject("./ponte_leca.glb", [
      -8.6942530416699988,
      41.18882222465502,
    ]);
    this.twinView.loadSingleObject("./Titan.kmz", [
      -8.71081747271464,
      41.18437848352964,
    ]);
  },

  beforeDestroy() {	
      SocketServiceHelper.deInitialize();	
  },

  methods: {},
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
canvas,
div {
  width: 100%;
  height: 100%;
}
</style>
