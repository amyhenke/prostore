import { PrismaClient } from '@prisma/client'
import sampleData from './sample-data'

async function main() {
    const prisma = new PrismaClient()

    // delete all existing products
    await prisma.product.deleteMany()

    // look in sampleData and create new products for each instance
    await prisma.product.createMany({ data: sampleData.products })

    console.log('Database seeded successfully!')
}

main()