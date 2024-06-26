"use server";
import { InsertBrands, UpdateBrands } from "@/types";
import { db } from "../../db";
import { authOptions } from "@/utils/authOptions";
import { revalidatePath } from "next/cache";

export async function getBrands({ sortDesc = false } = {}) {
  try {
    let dbQuery = db.selectFrom("brands").selectAll();

    if (sortDesc) {
      dbQuery = dbQuery.orderBy("created_at desc");
    }

    const brands = await dbQuery.execute();

    return brands;
  } catch (error) {
    throw error;
  }
}

export async function addBrand(value: InsertBrands) {
  try {
    if (!value.name) {
      return { error: "Brand name is required" };
    }

    await db.insertInto("brands").values(value).execute();

    revalidatePath("/brands");
    return { message: "success" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function editBrand(brandId: number, value: UpdateBrands) {
  try {
    if (!value.name) {
      return { error: "Brand name is required" };
    }

    await db
      .updateTable("brands")
      .set(value)
      .where("brands.id", "=", brandId)
      .execute();

    revalidatePath("/brands");
    return { message: "success" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteBrand(brandId: number) {
  try {
    await db.deleteFrom("brands").where("brands.id", "=", brandId).execute();

    revalidatePath("/brands");
    return { message: "success" };
  } catch (err: any) {
    return { error: err.message };
  }
}
export async function getBrandsIds(brands)
{
      try {

        let ids: number[] = [];

        for (const label of brands) {
    
          const result = await db
            .selectFrom("brands")
            .select("id")
            .where("name", "=", label)
            .execute();
    
          ids.push(result[0].id)
        }
        console.log("brans ids in ",ids)
        return ids        
        
      } catch (error) {
        console.log(`Error occured while takin ids of the brands: ${error}`)
        throw error
      }
}
