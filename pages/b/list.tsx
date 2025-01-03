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

  const deleteBuilding = async (id:string) => {
    if (confirm("Delete this building?")) {
      await fetch(`/api/building/delete/${id}`, {
        method: "DELETE",
      });
      setAllBuildings(allBuildings.filter((building) => building.id !== id));
    } else {
      console.error("not deleted");
    }
  }

  return (
    <main className="container mx-auto">
      <h1 className="text-lg font-semibold py-2">Buildings</h1>
      <div className="flex flex-col gap-2">
        {allBuildings.map((building) => (
          <div key={building.id} className="flex gap-2 border">
            <div className="w-16"><img src={building.image || undefined} alt={building.address || undefined} /></div>
            <div className="flex flex-col gap-2">
              <h2>{building.address}</h2>
              <p>{building.altName}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <button className="bg-blue-500 text-white p-2 rounded">Edit</button>
              <button className="bg-red-500 text-white p-2 rounded" onClick={() => deleteBuilding(building.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}