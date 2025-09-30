"use server"

import { CartItem } from "@/types"
import { cookies } from "next/headers"
import { prisma } from "@/db/prisma"
import { convertToPlainObject, formatError, round2 } from "../utils"
import { auth } from "@/auth"
import { cartItemSchema, insertCartSchema } from "../validators"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

// calculate cart prices (not total as doesn't include shipping and tax)
const calcPrice = (items: CartItem[]) => {
    // make sure to multiple by qty so dont readd multiple of the same - just increase qty
    const itemsPrice = round2(items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)),
        shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
        taxPrice = round2(0.15 * itemsPrice),
        totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    return {
        // ensure always 2 decimal places like money
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
    }
}

export async function addItemToCart(data: CartItem) {
    try {
        // check for cart cookie and get its value
        const sessionCartId = (await cookies()).get("sessionCartId")?.value

        if (!sessionCartId) throw new Error("Cart session not found")

        // get session and user ID
        const session = await auth()
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get cart
        const cart = await getMyCart()
        console.log("cart: ", cart)

        // parse and validate item
        const item = cartItemSchema.parse(data)
        console.log("item: ", item)

        // find product in DB
        const product = await prisma.product.findFirst({
            where: {
                id: item.productId,
            },
        })
        console.log("product: ", product)

        if (!product) throw new Error("Product not found")

        if (!cart) {
            // create new cart object if doesn't exist
            const newCart = insertCartSchema.parse({
                userId: userId,
                items: [item],
                sessionCartId: sessionCartId,
                // this is the object returned that has all the prices
                ...calcPrice([item]),
            })

            // add to DB
            await prisma.cart.create({
                data: newCart,
            })

            // revalidate product page - often needed when add to DB to clear cache and show change
            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} added to cart`,
            }
        } else {
            // check if item is already in cart
            const existItem = (cart.items as CartItem[]).find(x => x.productId === item.productId)

            if (existItem) {
                // check stock
                if (product.stock < existItem.qty + 1) {
                    throw new Error("Not enough stock")
                }

                // increase qty
                ;(cart.items as CartItem[]).find(x => x.productId === item.productId)!.qty = existItem.qty + 1
            } else {
                // if item does NOT exist in cart
                // check stock
                if (product.stock < 1) throw new Error("Not enough stock")

                // add item to cart.items as its new to the cart
                cart.items.push(item)
            }

            // save to DB
            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    items: cart.items as Prisma.CartUpdateitemsInput[],
                    ...calcPrice(cart.items as CartItem[]),
                },
            })

            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} ${existItem ? "updated in" : "added to"} cart`,
            }
        }
    } catch (error) {
        return {
            success: false,
            message: formatError(error),
        }
    }
}

export async function getMyCart() {
    // check for cart cookie and get its value
    const sessionCartId = (await cookies()).get("sessionCartId")?.value

    if (!sessionCartId) throw new Error("Cart session not found")

    // get session and user ID
    const session = await auth()
    const userId = session?.user?.id ? (session.user.id as string) : undefined

    // get user cart from DB
    // if there is a user ID (logged in) then use that ID to get the cart, if not then use the sessionCartId cookie to get the cart
    const cart = await prisma.cart.findFirst({
        where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
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
