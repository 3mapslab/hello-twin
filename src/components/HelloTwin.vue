<template>
  <div>
    <canvas ref="world"></canvas>
    <Stats />
  </div>
</template>

<script>
import TwinView from "@/digitaltwin/TwinView";
import Stats from "./Stats";

const mooringBitsProperties = {
  depth: 0.1,
  altitude: -1,
  material: {
    color: "#ffffff",
    texture: "./plainroof.jpg",
  },
  model: "./cabeco.json"
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

const containersProperties = {
  depth: 0.2,
  altitude: 0.1,
  material: {
    color: "blue",
  },
}

const layerProperties = [
  {
    url: "buildings",
    properties: buildingsProperties,
  },
  {
    url: "gardens_v2",
    properties: gardensProperties,
  },
  {
    url: "mooring_bitt",
    properties: mooringBitsProperties,
  },
  {
    url: "roads_v2",
    properties: roadsProperties,
  },
  {
    url: "parks_v2",
    properties: parkProperties,
  },
  {
    url:"containers_xyz",
    properties: containersProperties,
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
      initialPosition: { lat: 41.185523935676713, lng: -8.7016652234108349 },
    };
    this.twinView = new TwinView(this.$refs.world, configs, layerProperties);
    this.twinView.loadSingleObject("ponte_leca.glb", [
      -8.6942530416699988,
      41.18882222465502,
    ]);
  },
  methods: {
  },
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
