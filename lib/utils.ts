import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert prisma object into regular JS object
// <T> generic - is a placeholder for any type that the function my accept when its called, could be string, object, prisma model etc. 
// (value: T) - specifies the type of the parameter. TS infers the type at the time of the function call
// (): T is return type. So the return type should be the same type as the input e.g. if called it with a Product object then it should return a Product
export function convertToPlainObject<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}

// Format number with decimal places (for price)
export function formatNumberWithDecimal(num: number): string {
    const [int, decimal] = num.toString().split('.')

    // padEnd means if its 49.9 it will add another 0 onto it
    return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`
}

// Format sign up errors
// eslint-disabled-next-line @typescript-eslink/no-explicit-any
export async function formatError(error: any) {
    if (error.name === 'ZodError') {
        // handle zod error
        const fieldErrors = Object.keys(error.errors).map((field) => error.errors[field].message)

        return fieldErrors.join('. ')
    } else if (error.name === 'PrismaClientKnownRequestError' && error.code === "P2002") {
        // handle prisma error
        const field = error.meta?.target ? error.meta.target[0] : 'Field'

        // capitalise first letter, add rest of word (name of field)
        return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    } else {
        // handle other errors
        // if error is a string, display it. if not, turn into a string and display
        return typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
    }
} 