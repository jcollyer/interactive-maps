import prisma from "@/lib/prisma";

export default async (req:any, res:any) => {
  const buildingId = req.query.id;
  if (req.method === "DELETE") {
    const building = await prisma.building.delete({
      where: { id: buildingId },
    });
    res.json(building);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}