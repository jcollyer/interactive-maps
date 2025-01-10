'use client';

import React, { useState } from 'react';
import prisma from "@/lib/prisma";
import { Building } from '@prisma/client';
import DebouncedInput from '@/app/components/DebounceInput';
import BuildingRow from '@/app/components/BuildingRow';

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
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Building[]>([]);

  return (
    <main className="container mx-auto pt-16">
      <div className="flex my-2">
        <h1 className="text-lg font-semibold py-2">{buildings.length} Buildings</h1>
        <div className="w-72 ml-auto">
          <DebouncedInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setSearchResults(allBuildings.filter((building) => building.address?.toLowerCase().includes(value.toLowerCase())))
            }}
            placeholder="Search buildings"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {!!search.length && searchResults.map((building) =>
          <BuildingRow building={building} allBuildings={allBuildings} singleBuilding={singleBuilding} setSingleBuilding={setSingleBuilding} setAllBuildings={setAllBuildings} />
        )}

        {!search.length && allBuildings.map((building) =>
          <BuildingRow building={building} allBuildings={allBuildings} singleBuilding={singleBuilding} setSingleBuilding={setSingleBuilding} setAllBuildings={setAllBuildings} />
        )}
      </div>
    </main>
  );
}