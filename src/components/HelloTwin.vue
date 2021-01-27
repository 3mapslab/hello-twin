<template>
  <div>
    <canvas ref="world"></canvas>
    <Stats />
  </div>
</template>

<script>
import TwinView from "@/digitaltwin/TwinView";
import Stats from "./Stats";

const buildingsProperties = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#6495ed",
  },
};

const roadsProperties = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#000000",
  },
};

const gardensProperties = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#008000",
  },
};

const parkProp = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#808080",
  },
};

export default {
  components: {
    Stats,
  },
  methods: {
    async loadBuildings() {
      fetch("https://triedeti.pt/data_geojson/buildings_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.loadLayerToScene(
            null,
            data,
            buildingsProperties,
            false
          );
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/parks_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.loadLayerToScene(null, data, parkProp, false);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/gardens_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.loadLayerToScene(null, data, gardensProperties, false);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/roads_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.loadLayerToScene(null, data, roadsProperties, false);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });
    },
  },
  mounted() {
    const configs = {
      initialPosition: { lat: 41.185523935676713, lng: -8.7016652234108349 },
    };
    this.twinView = new TwinView(this.$refs.world, configs);
    this.loadBuildings();
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
