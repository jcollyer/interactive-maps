'use client';

import React, { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import {Check} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  function buildContent(property: Building) {
    const content = document.createElement("div");
    content.classList.add("property");
    content.classList.add("max-w-24");

    content.innerHTML = `
    <div class="flex flex-col">
      <div class="details p-2">
        <div class="font-bold">${property.address}</div>
        <div>${property.altName}</div>
      </div>
      <div class="relative p-[2px]">
        <i aria-hidden="true" class="fa fa-icon fa-building" title="building"></i>
        <img class="w-full" src="${property.image}" alt="Property Image" />
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

      // Middle-ish of Manhattan
      const locationInMap = { lat: 40.7348077, lng: -73.9897257 };

      const options: google.maps.MapOptions = {
        center: locationInMap,
        zoom: 14,
        mapId: 'jc-interactive-map',
      };

      const map = new Map(mapRef.current as HTMLDivElement, options);
      const SwitchLevel = 16;

      for (const property of buildings) {
        const AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: buildContent(property),
          position: { lat: property.lat || 0, lng: property.lng || 0 },
          title: property.address,
        });

        const pin = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: property.lat || 0, lng: property.lng || 0 },
          title: 'This marker is visible at zoom level SwitchLevel and lower.'
        });

        AdvancedMarkerElement.addListener("click", () => {
          toggleHighlight(AdvancedMarkerElement, property);
          setClipboard((prev) => [...prev, ...(!prev.includes(property.address) && [property.address]) || [], ...(!!property.altName && !prev.includes(property.altName) && [property.altName] || [])]);
        });

        map.addListener('idle', () => {
          const zoom = map.getZoom();
          // Only show each marker above a certain zoom level.
          if (zoom) {
            AdvancedMarkerElement.map = zoom > SwitchLevel ? map : null;
            pin.map = zoom <= SwitchLevel ? map : null;
          }
        });
      }
    }
    // Initialize the map on component mount
    initializeMap();
  }, []);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }
  }, [copied]);

  return (
    <main>
      <div className="h-screen" ref={mapRef} />
      <div className="fixed bottom-0 p-4 bg-white w-full">
        <div className="flex max-w-screen-xl mx-auto">
          {clipboard.length === 0 && (<p className="font-semibold text-xs text-gray-400">Copy Board</p>)}
          <div className="flex items-center gap-2 overflow-scroll">
            {clipboard.map((address, index) => (
              <div key={index} className="whitespace-nowrap">{address},</div>
            ))}
          </div>
          <div className="flex gap-2 ml-auto " style={{ boxShadow: "-20px 0px 18px 10px white" }}>
            <button type="button" onClick={() => {
              setCopied(true);
              navigator.clipboard.writeText(clipboard.map(address => address).join(", "))}
             } 
             className="px-5 py-3 text-base font-medium text-center inline-flex items-center text-white bg-blue-600 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button className="border px-4 py-1 rounded" onClick={() => setClipboard([])}>Clear</button>
          </div>
        </div>
      </div>
    </main>
  );
}