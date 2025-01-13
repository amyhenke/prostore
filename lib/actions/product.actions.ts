"use server"

import { PrismaClient } from "@prisma/client"
import { convertToPlainObject } from "../utils"
import { LATEST_PRODUCTS_LIMIT } from "../constants"

// Get latest products
export async function getLatestProducts() {
    const prisma = new PrismaClient()

    const data = await prisma.product.findMany({
        // limit to 4
        take: LATEST_PRODUCTS_LIMIT,
        // show latest first
        orderBy: { createdAt: 'desc'}
    })

    return convertToPlainObject(data)
}