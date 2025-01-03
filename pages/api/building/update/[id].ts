import prisma from "@/lib/prisma";

export default async function handleUpdate(req: any, res: any) {
  const buildingId = req.query.id;

  if (req.method === "PUT") {
    const building = await prisma.building.update({
      where: { id: buildingId },
      data:req.body,
    });
    res.json(building);
  } else {
    throw new Error(
      `Updating building with ID: ${buildingId} was not sucessful`
    );
  }
}
