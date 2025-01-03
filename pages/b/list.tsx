'use client';

import React, { useState } from 'react';
import prisma from "@/lib/prisma";
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

export default function ListBuildings({ buildings }: { buildings: Building[] }) {
  const [allBuildings, setAllBuildings] = useState<Building[]>(buildings);
  const [singleBuilding, setSingleBuilding] = useState<Building | null>(null);

  const deleteBuilding = async (id: string) => {
    if (confirm("Delete this building?")) {
      await fetch(`/api/building/delete/${id}`, {
        method: "DELETE",
      });
      setAllBuildings(allBuildings.filter((building) => building.id !== id));
    } else {
      console.error("not deleted");
    }
  }

  const editBuilding = async () => {
    try {
      const body = singleBuilding;

      console.log('--body->', body);
      await fetch(`/api/building/update/${singleBuilding?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="container mx-auto">
      <h1 className="text-lg font-semibold py-2">Buildings</h1>
      <div className="flex flex-col gap-2">
        {allBuildings.map((building) => {
          const isBeingEdited = singleBuilding?.id === building.id;
          return (
            <div key={building.id} className="flex gap-2 border">
              <div className="w-16"><img src={building.image || undefined} alt={building.address || undefined} /></div>
              <div className="flex flex-col flex-1">
                <div>{isBeingEdited ? (<input className="w-full" value={singleBuilding.address || undefined} onChange={(e) => setSingleBuilding({ ...singleBuilding, address: e.target.value })} />) : building.address}</div>
                <div>{isBeingEdited ? (<input value={singleBuilding.altName || undefined} onChange={(e) => setSingleBuilding({ ...singleBuilding, altName: e.target.value })} />) : building.altName}</div>
                <div>{isBeingEdited ? (<input value={singleBuilding.lat || undefined} onChange={(e) => setSingleBuilding({ ...singleBuilding, lat: Number(e.target.value) })} />) : building.lat}</div>
                <div>{isBeingEdited ? (<input value={singleBuilding.lng || undefined} onChange={(e) => setSingleBuilding({ ...singleBuilding, lng: Number(e.target.value) })} />) : building.lng}</div>
                {/* <div>{isBeingEdited && <input type="checkbox" checked={singleBuilding.publish} onChange={() => setSingleBuilding({...singleBuilding, publish: !singleBuilding.publish})} />}</div> */}
                {/* <p>{building.altName}</p> */}
              </div>
              <div className="flex gap-2 ml-auto">
                {isBeingEdited && <button className={building !== singleBuilding ? "bg-green-500 text-white p-2 rounded" : "bg-gray-300 text-white p-2 rounded"} onClick={editBuilding}>Save Edit</button>}
                {isBeingEdited && <button className="bg-gray-500 text-white p-2 rounded" onClick={() => setSingleBuilding(null)}>Cancel Edit</button>}
                {!isBeingEdited && <button className="bg-blue-500 text-white p-2 rounded" onClick={() => setSingleBuilding(building)}>Edit</button>}
                <button className="bg-red-500 text-white p-2 rounded" onClick={() => deleteBuilding(building.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}