import {createSelector} from "reselect";

export const selectLayoutRender = createSelector(
  // Selects layout, feeds, spocs so that we only recompute if
  // any of these values change.
  [
    state => state.DiscoveryStream.layout,
    state => state.DiscoveryStream.feeds,
    state => state.DiscoveryStream.spocs,
  ],

  // Adds data to each component from feeds. This function only re-runs if one of the inputs change.
  // TODO: calculate spocs
  function layoutRender(layout, feeds, spocs) {
    let spocIndex = 0;

    function maybeInjectSpocs(data, spocsConfig) {
      if (data &&
          spocsConfig && spocsConfig.positions && spocsConfig.positions.length &&
          spocs.data.spocs && spocs.data.spocs.length) {
        const recommendations = [...data.recommendations];
        for (let position of spocsConfig.positions) {
          let rickRoll = Math.random();
          if (spocs.data.spocs[spocIndex] && rickRoll <= spocsConfig.probability) {
            recommendations.splice(position.index, 0, spocs.data.spocs[spocIndex++]);
          }
        }

        return {
          ...data,
          recommendations,
        };
      }

      return data;
    }

    const positions = {};

    return layout.map(row => ({
      ...row,

      // Loops through all the components and adds a .data property
      // containing data from feeds
      components: row.components.map(component => {
        if (!component.feed || !feeds.data[component.feed.url]) {
          return component;
        }

        positions[component.type] = positions[component.type] || 0;

        let {data} = feeds.data[component.feed.url];

        if (component && component.properties && component.properties.offset) {
          data = {
            ...data,
            recommendations: data.recommendations.slice(component.properties.offset),
          };
        }

        data = maybeInjectSpocs(data, component.spocs);

        let items = 0;
        if (component.properties && component.properties.items) {
          items = Math.min(component.properties.items, data.recommendations.length);
        }

        // loop through a component items
        // Store the items position sequentially for multiple components of the same type.
        // Example: A second card grid starts pos offset from the last card grid.
        for (let i = 0; i < items; i++) {
          data.recommendations[i].pos = positions[component.type]++;
        }

        return {...component, data};
      }),
    }));
  }
);
