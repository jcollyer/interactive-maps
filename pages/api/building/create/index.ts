import prisma from "@/lib/prisma";

interface Building {
  buildingAdress: string;
  buildingAltName: string;
  buildingLat: string;
  buildingLng: string;
  buildingImage: string;
  publish: boolean;
}

export default async (req:{body:Building}, res:any) => {
  const { buildingAdress, buildingAltName, buildingLat, buildingLng, buildingImage, publish } = req.body;
  const result = await prisma.building.create({
    data: {
      address: buildingAdress,
      altName: buildingAltName,
      image: buildingImage,
      lat: Number(buildingLat),
      lng: Number(buildingLng),
      publish: publish,
    },
  });
  res.json(result);
};
