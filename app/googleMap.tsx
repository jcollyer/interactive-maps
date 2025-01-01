'use client';

import React, { useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import properties from './properties';

export default function GoogleMaps() {
  const mapRef = React.useRef<HTMLDivElement>(null);

  function buildContent(property) {
    const content = document.createElement("div");
    content.classList.add("property");
    content.innerHTML = `
      <div class="icon">
          <i aria-hidden="true" class="fa fa-icon fa-${property.type}" title="${property.type}"></i>
          <span class="fa-sr-only">${property.type}</span>
      </div>
      <div class="details">
          <div class="price">${property.price}</div>
          <div class="address">${property.address}</div>
          <div class="features">
          <div>
              <i aria-hidden="true" class="fa fa-bed fa-lg bed" title="bedroom"></i>
              <span class="fa-sr-only">bedroom</span>
              <span>${property.bed}</span>
          </div>
          <div>
              <i aria-hidden="true" class="fa fa-bath fa-lg bath" title="bathroom"></i>
              <span class="fa-sr-only">bathroom</span>
              <span>${property.bath}</span>
          </div>
          <div>
              <i aria-hidden="true" class="fa fa-ruler fa-lg size" title="size"></i>
              <span class="fa-sr-only">size</span>
              <span>${property.size} ft<sup>2</sup></span>
          </div>
          </div>
      </div>
      `;

    return content;
  }

  function toggleHighlight(markerView, property) {
    console.log(markerView);
    if (markerView.content.classList.contains("highlight")) {
      markerView.content.classList.remove("highlight");
      markerView.zIndex = null;
    } else {
      markerView.content.classList.add("highlight");
      markerView.zIndex = 1;
    }
  }

  useEffect(() => {
    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
        version: 'quartely',
      });

      // Load the map library
      const { Map } = await loader.importLibrary('maps');

      // Loat the marker library
      await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      const locationInMap = { lat: 37.43238031167444, lng: -122.16795397128632 };

      const options: google.maps.MapOptions = {
        center: locationInMap,
        zoom: 11,
        mapId: 'jc-interactive-map',
      };

      const map = new Map(mapRef.current as HTMLDivElement, options);

      for (const property of properties) {
        const AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: buildContent(property),
          position: property.position,
          title: property.description,
        });

        AdvancedMarkerElement.addListener("click", () => {
          toggleHighlight(AdvancedMarkerElement, property);
        });
      }
    }
    // Initialize the map on component mount
    initializeMap();
  }, []);

  return <div className="h-full" ref={mapRef} />;
}