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
    texture: "./building.png",
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
    texture: "./garden.jpg",
  },
};

const parkProperties = {
  depth: 0.2,
  altitude: 0.1,
  material: {
    color: "#6B6B6B",
  },
};

/*
const containersProperties = {
  width: 6.06,
  height: 2.6,
  depth: 2.44,
  altitude: 0.1,
  material: {
    color: "blue",
  },
}
*/

const treesPropertiesBottom = {
  depth: 0.1,
  altitude: 2.0,
  model: "./tree_tronco.json",
  material: {
    color: "#8B4513",
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
  /*
  {
    url:"contentores_complexos",
    properties: containersProperties,
    type: "INSTANCED",
  },
  */
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
      initialPosition: { lat: 41.185523935676713, lng: -8.7016652234108349 },
    };
    this.twinView = new TwinView(this.$refs.world, configs, layerProperties);
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
