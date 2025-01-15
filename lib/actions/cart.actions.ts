"use server"

import { CartItem } from "@/types"
import { cookies } from "next/headers"
import { prisma } from "@/db/prisma"
import { convertToPlainObject, formatError } from "../utils"
import { auth } from "@/auth"
import { cartItemSchema } from "../validators"

export async function addItemToCart(data: CartItem) {
    try {
        // check for cart cookie and get its value
        const sessionCartId = ((await cookies()).get('sessionCartId')?.value)

        if (!sessionCartId) throw new Error('Cart session not found')

        // get session and user ID
        const session = await auth()
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get cart
        const cart = await getMyCart()

        // parse and validate item
        const item = cartItemSchema.parse(data)

        // find product in DB
        const product = await prisma.product.findFirst({
            where: {
                id: item.productId
            }
        })

        // TESTING
        console.log({
            'Session Cart ID': sessionCartId,
            'User ID': userId,
            'Item Requested': item,
            'Product Found': product
        })

        return {
            success: true,
            message: 'Item added to cart'
        }
    } catch (error) {
        return {
        success: false,
        message: formatError(error)
    }
    }
}

export async function getMyCart() {
    // check for cart cookie and get its value
    const sessionCartId = ((await cookies()).get('sessionCartId')?.value)

    if (!sessionCartId) throw new Error('Cart session not found')

    // get session and user ID
    const session = await auth()
    const userId = session?.user?.id ? (session.user.id as string) : undefined

    // get user cart from DB
    // if there is a user ID (logged in) then use that ID to get the cart, if not then use the sessionCartId cookie to get the cart
    const cart = await prisma.cart.findFirst({
        where: userId ? { userId: userId } : { sessionCartId: sessionCartId }
    })

    if (!cart) return undefined

    // convert decimals and return
    return convertToPlainObject({
        // coverts prisma object to plain JS object
        ...cart,
        items: cart.items as CartItem[],
        itemsPrice: cart.itemsPrice.toString(),
        totalPrice: cart.totalPrice.toString(),
        shippingPrice: cart.shippingPrice.toString(),
        taxPrice: cart.taxPrice.toString(),
    })
}