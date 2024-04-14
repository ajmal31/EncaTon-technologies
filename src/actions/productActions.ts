// @ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { useRouter } from "next/router";
import { cache } from "react";
import { getCategoryIds } from "./categoryActions";
import { getBrandsIds } from "./brandActions";


export async function getProducts(pageNo = 1, pageSize = DEFAULT_PAGE_SIZE) {
  try {
    let products;
    let dbQuery = db.selectFrom("products").selectAll("products");

    const { count } = await dbQuery
      // .select(sql`COUNT(DISTINCT products.id) as count`)
      .executeTakeFirst();

    const lastPage = Math.ceil(count / pageSize);

    products = await dbQuery
      .distinct()
      .offset((pageNo - 1) * pageSize)
      .limit(pageSize)
      .execute();

    const numOfResultsOnCurPage = products.length;

    return { products, count, lastPage, numOfResultsOnCurPage };
  } catch (error) {
    throw error;
  }
}

export const getProduct = cache(async function getProduct(productId: number) {
  // console.log("run");
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    return { error: "Could not find the product" };
  }
});

async function enableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 1`.execute(db);
}

async function disableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 0`.execute(db);
}



export async function deleteProduct(productId: number) {
  try {
    await disableForeignKeyChecks();
    await db
      .deleteFrom("product_categories")
      .where("product_categories.product_id", "=", productId)
      .execute();
    await db
      .deleteFrom("reviews")
      .where("reviews.product_id", "=", productId)
      .execute();

    await db
      .deleteFrom("comments")
      .where("comments.product_id", "=", productId)
      .execute();

    await db.deleteFrom("products").where("id", "=", productId).execute();

    await enableForeignKeyChecks();
    revalidatePath("/products");
    return { message: "success" };
  } catch (error) {
    return { error: "Something went wrong, Cannot delete the product" };
  }
}



export async function MapBrandIdsToName(brandsId) {
  const brandsMap = new Map();
  try {
    for (let i = 0; i < brandsId.length; i++) {
      const brandId = brandsId.at(i);
      const brand = await db
        .selectFrom("brands")
        .select("name")
        .where("id", "=", +brandId)
        .executeTakeFirst();
      brandsMap.set(brandId, brand?.name);
    }
    return brandsMap;
  } catch (error) {
    throw error;
  }
}

export async function getAllProductCategories(products: any) {
  try {
    const productsId = products.map((product) => product.id);
    const categoriesMap = new Map();

    for (let i = 0; i < productsId.length; i++) {
      const productId = productsId.at(i);
      const categories = await db
        .selectFrom("product_categories")
        .innerJoin(
          "categories",
          "categories.id",
          "product_categories.category_id"
        )
        .select("categories.name")
        .where("product_categories.product_id", "=", productId)
        .execute();
      categoriesMap.set(productId, categories);
    }
    return categoriesMap;
  } catch (error) {
    throw error;
  }
}

export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    throw error;
  }
}

// Adding New Product
export async function addProduct(productDetails: any) {

  try {
    const { name, description, old_price, price, discount, rating, colors, brands, categories, gender, occasion, image_url } = productDetails
    const categoriesArr = []
    const brandsArr = []
    const occasionArr = []
    for (const val of categories) {
      categoriesArr.push(val.label)
    }
    for (const val of brands) {
      brandsArr.push(val.label)
    }
    for (const val of occasion) {
      occasionArr.push(val.label)
    }
    const categorieIds = await getCategoryIds(categoriesArr)
    const brandIds = await getBrandsIds(brandsArr)

    let response = await db.insertInto("products").values({
      name: name,
      description: description,
      old_price: old_price,
      price: price,
      discount: discount,
      rating: rating,
      colors: colors,
      // Store brandIds as an array
      brands: JSON.stringify(brandIds),
      gender: gender,
      // Convert occasionArr array to a comma-separated string
      occasion: occasionArr.join(','),
      image_url: image_url
    }).executeTakeFirst();

    console.log("response after inserting to mySql", response)
    let pid = response.insertId
    let response2 = await addProdctCategories(pid, categorieIds)
    return "product Added"


  } catch (err) {
    console.log("Error occured while inserting data into my sql", err)
    throw err
  }

}

//Adding pid to product categories
export async function addProdctCategories(pid, cids) {
  try {
    for (const cid of cids) {

      await db.insertInto("product_categories").values({
        category_id: cid,
        product_id: pid

      }).executeTakeFirst()

    }

    return true

  } catch (error) {

    console.log(`Error occured while addinng productCategories : ${error}`)

  }
}
// Edit Product 
export async function editProduct(productDetails: any, pid: number) {
  try {

    const { name, description, old_price, price, discount, rating, colors, brands, categories, gender, occasion, image_url } = productDetails
    const categoriesArr = []
    const brandsArr = []
    const occasionArr = []

    for (const val of categories) {
      categoriesArr.push(val.label)
    }
    for (const val of brands) {
      brandsArr.push(val.label)
    }
    for (const val of occasion) {
      occasionArr.push(val.label)
    }

    const categorieIds = await getCategoryIds(categoriesArr)
    const brandIds = await getBrandsIds(brandsArr)

    const updateData = {
      name: name,
      description: description,
      old_price: old_price,
      price: price,
      discount: discount,
      rating: rating,
      colors: colors,
      brands: JSON.stringify(brandIds),
      gender: gender,
      occasion: occasionArr.join(','),

    }
    if (image_url.length !== 0) {

      updateData.image_url = image_url
    } else {
      console.log(image_url)
    }

    const response = await db.updateTable("products").set(updateData).where('id', "=", pid).executeTakeFirst()

    console.log(`after editing ${pid} product and response ${response}`)
    return "product edited"

  } catch (error) {

    throw error
  }


}

//Ascending or Descending Dynamic Sorting
export async function sortByProducts(order:Array){

  try {
    const result =await db
    .selectFrom('products')
    .selectAll() 
    .orderBy(order[0], order[1]) 
    .limit(10)
    .execute();
    return result


  } 
  catch (error) {
    console.error('Error occurred:', error);
    throw error;
  }


}


