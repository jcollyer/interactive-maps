'use client';

import React, { useEffect, useState } from 'react';
import prisma from "@/lib/prisma";
import { Loader } from '@googlemaps/js-api-loader';
import { Building } from '@prisma/client';

export const getStaticProps = async () => {
  const buildings = await prisma.building.findMany({
    where: { publish: true },
  });

  return {
    props: { buildings },
    revalidate: 10,
  };
};

export default function GoogleMaps({ buildings }: { buildings: Building[] }) {
  const mapRef = React.useRef<HTMLDivElement>(null);

  const [clipboard, setClipboard] = useState<(string | null)[]>([]);

  function buildContent(property: Building) {
    const content = document.createElement("div");
    content.classList.add("property");
    content.innerHTML = `
    <div class="flex flex-col p-2">
      <div class="details">
        <div class="font-bold">${property.address}</div>
        <div>${property.altName}</div>
      </div>
      <div class="relative bg-blue-600 p-1 rounded">
        <i aria-hidden="true" class="fa fa-icon fa-building" title="building"></i>
        <img src="${property.image}" alt="Property Image" />
        <div class="arrow">&nbsp;</div>
      </div>
    </div>
    `;

    return content;
  }

  function toggleHighlight(markerView: any, property: Building) {
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

      // Load the marker library
      await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      const locationInMap = { lat: 40.776676, lng: -73.971321 };

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
          position: { lat: property.lat || 0, lng: property.lng || 0 },
          title: property.address,
        });

        AdvancedMarkerElement.addListener("click", () => {
          toggleHighlight(AdvancedMarkerElement, property);
          setClipboard((prev) => [...prev, property.address, ...(!!property.altName && [property.altName] || [])]);
        });
      }
    }
    // Initialize the map on component mount
    initializeMap();
  }, []);

  return (
    <main>
      <div className="h-screen" ref={mapRef} />
      <div className="fixed bottom-0 p-4 bg-white w-full">
        <div className="flex">
        <div><h3 className="font-semibold">Copy Board</h3></div>
        <div className="flex gap-2 ml-auto">
          <button className="border px-4 py-1 rounded bg-blue-600 text-white" onClick={() => navigator.clipboard.writeText(clipboard.map(address => address).join(","))}>Copy</button>
          <button className="border px-4 py-1 rounded"onClick={() => setClipboard([])}>Clear</button>
        </div>
        </div>
        <div className="flex gap-2">
          {clipboard.map((address, index) => (
            <div key={index}>{address},</div>
          ))}
        </div>
      </div>
    </main>
  );
}