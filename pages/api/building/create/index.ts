import prisma from "@/lib/prisma";
import { Building } from "@prisma/client";

export default async (req:{body:Building}, res:any) => {
  console.log('--------', req.body)
  const result = await prisma.building.create({
    data: req.body
  });
  res.json(result);
};
