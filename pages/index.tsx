'use client';

import React, { useEffect } from 'react';
import prisma from "@/lib/prisma";
import { Loader } from '@googlemaps/js-api-loader';
import { Building } from '@prisma/client';

export const getStaticProps = async () => {
  console.log('buildings===>',);
  const buildings = await prisma.building.findMany({
    where: { publish: true },
  });

  return {
    props: { buildings },
    revalidate: 10,
  };
};


export default function GoogleMaps({buildings}: {buildings: Building[]}) {
  const mapRef = React.useRef<HTMLDivElement>(null);

  
  function buildContent(property: Building) {
    const content = document.createElement("div");
    content.classList.add("property");
    content.innerHTML = `
      <div class="icon">
        <i aria-hidden="true" class="fa fa-icon fa-building" title="building"></i>
        <span class="fa-sr-only">building</span>
        <img src="${property.image}" alt="Property Image" />
      </div>
      <div class="details">
        
          <div class="font-bold">${property.address}</div>
          <div>${property.altName}</div>
      </div>
      `;

    return content;
  }

  function toggleHighlight(markerView: any, property: Building) {
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

      for (const property of buildings) {
        const AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: buildContent(property),
          position: {lat: property.lat || 0, lng: property.lng || 0},
          title: property.address,
        });

        AdvancedMarkerElement.addListener("click", () => {
          toggleHighlight(AdvancedMarkerElement, property);
        });
      }
    }
    // Initialize the map on component mount
    initializeMap();
  }, []);

  return <div className="h-screen" ref={mapRef} />;
}