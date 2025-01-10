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

  return (
    <main>
      <div className="h-screen" ref={mapRef} />
      <div className="fixed bottom-0 p-4 bg-white w-full">
        <div className="flex">
          {clipboard.length === 0 && (<p className="font-semibold text-sm">Copy Board</p>)}
          <div className="flex items-center gap-2 overflow-scroll">
            {clipboard.map((address, index) => (
              <div key={index} className="whitespace-nowrap">{address},</div>
            ))}
          </div>
          <div className="flex gap-2 ml-auto " style={{ boxShadow: "-20px 0px 18px 10px white" }}>
            <button type="button" onClick={() => navigator.clipboard.writeText(clipboard.map(address => address).join(","))} className="px-5 py-3 text-base font-medium text-center inline-flex items-center text-white bg-blue-600 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300">
              <svg width="24" height="24" className="mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8.94C20.9896 8.84813 20.9695 8.75763 20.94 8.67V8.58C20.8919 8.47718 20.8278 8.38267 20.75 8.3L14.75 2.3C14.6673 2.22222 14.5728 2.15808 14.47 2.11C14.4402 2.10576 14.4099 2.10576 14.38 2.11C14.2784 2.05174 14.1662 2.01434 14.05 2H10C9.20435 2 8.44129 2.31607 7.87868 2.87868C7.31607 3.44129 7 4.20435 7 5V6H6C5.20435 6 4.44129 6.31607 3.87868 6.87868C3.31607 7.44129 3 8.20435 3 9V19C3 19.7956 3.31607 20.5587 3.87868 21.1213C4.44129 21.6839 5.20435 22 6 22H14C14.7956 22 15.5587 21.6839 16.1213 21.1213C16.6839 20.5587 17 19.7956 17 19V18H18C18.7956 18 19.5587 17.6839 20.1213 17.1213C20.6839 16.5587 21 15.7956 21 15V9C21 9 21 9 21 8.94ZM15 5.41L17.59 8H16C15.7348 8 15.4804 7.89464 15.2929 7.70711C15.1054 7.51957 15 7.26522 15 7V5.41ZM15 19C15 19.2652 14.8946 19.5196 14.7071 19.7071C14.5196 19.8946 14.2652 20 14 20H6C5.73478 20 5.48043 19.8946 5.29289 19.7071C5.10536 19.5196 5 19.2652 5 19V9C5 8.73478 5.10536 8.48043 5.29289 8.29289C5.48043 8.10536 5.73478 8 6 8H7V15C7 15.7956 7.31607 16.5587 7.87868 17.1213C8.44129 17.6839 9.20435 18 10 18H15V19ZM19 15C19 15.2652 18.8946 15.5196 18.7071 15.7071C18.5196 15.8946 18.2652 16 18 16H10C9.73478 16 9.48043 15.8946 9.29289 15.7071C9.10536 15.5196 9 15.2652 9 15V5C9 4.73478 9.10536 4.48043 9.29289 4.29289C9.48043 4.10536 9.73478 4 10 4H13V7C13 7.79565 13.3161 8.55871 13.8787 9.12132C14.4413 9.68393 15.2044 10 16 10H19V15Z" fill="white" />
              </svg>
              Copy
            </button>
            <button className="border px-4 py-1 rounded" onClick={() => setClipboard([])}>Clear</button>
          </div>
        </div>
      </div>
    </main>
  );
}