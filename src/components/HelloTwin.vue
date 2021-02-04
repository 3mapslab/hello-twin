<template>
  <div>
    <canvas ref="world"></canvas>
    <Stats />
  </div>
</template>

<script>
import TwinView from "@/digitaltwin/TwinView";
import Stats from "./Stats";

const terrainProperties = {
  depth: 0.1,
  altitude: -1,
  material: {
    color: "#ffffff",
  },
};

const buildingsProperties = {
  depth: 10,
  altitude: 0.1,
  material: {
    color: "#6495ed",
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
    color: "#008000",
  },
};

const parkProperties = {
  depth: 0.2,
  altitude: 0.1,
  material: {
    color: "#808080",
  },
};

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
    properties: terrainProperties,
  },
  {
    url: "roads_v2",
    properties: roadsProperties,
  },
  {
    url: "parks_v2",
    properties: parkProperties,
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
    await this.loadBuildings();
  },
  methods: {
    async loadBuildings() {
      /*
      fetch("https://triedeti.pt/data_geojson/mooring_bitt.geo.json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.storeGeojsonLayer(1, data, terrainProperties);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

       fetch("https://triedeti.pt/data_geojson/buildings.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.storeGeojsonLayer(2, data, buildingsProperties);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/parks_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.storeGeojsonLayer(3, data, parkProp);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/gardens_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.storeGeojsonLayer(4, data, gardensProperties);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });

      fetch("https://triedeti.pt/data_geojson/roads_v2.geojson")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.twinView.storeGeojsonLayer(5, data, roadsProperties);
        })
        .catch((err) => {
          console.log("Fetch Error", err);
        });
        */
    },
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
