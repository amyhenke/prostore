import { PrismaClient } from '@prisma/client'
import sampleData from './sample-data'

async function main() {
    const prisma = new PrismaClient()

    // delete all existing data in all tables
    await prisma.product.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.verificationToken.deleteMany()
    await prisma.user.deleteMany()

    // look in sampleData and create new products for each instance
    await prisma.product.createMany({ data: sampleData.products })

    // add sample users from sampleData file
    await prisma.user.createMany({ data: sampleData.users })

    console.log('Database seeded successfully!')
}

main()