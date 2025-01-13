"use server"

import { prisma } from "@/db/prisma"
import { convertToPlainObject } from "../utils"
import { LATEST_PRODUCTS_LIMIT } from "../constants"

// Get latest products
export async function getLatestProducts() {
    const data = await prisma.product.findMany({
        // limit to 4
        take: LATEST_PRODUCTS_LIMIT,
        // show latest first
        orderBy: { createdAt: 'desc'}
    })

    return convertToPlainObject(data)
}

// Get single product by slug
export async function getProductBySlug(slug: string) {
    return await prisma.product.findFirst({
        where: { slug: slug }
    })
}