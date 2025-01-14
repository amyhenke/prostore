"use server"

import { signInFormSchema, signUpFormSchema } from "../validators"
import { signIn, signOut } from "@/auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { hashSync } from "bcrypt-ts-edge"
import { prisma } from "@/db/prisma"
import { formatError } from "../utils"

// Sign in user with credentials
// when we create the form we're gunna use a new react hook called UseActionState() - when submit an action with that hook need prevState as first argument
export async function signInWithCredentials(prevState: unknown, formData: FormData) {
    try {
        // use the validator schema (zod) by calling its name and parse(). keeps the code here clean as validation not needed
        const user = signInFormSchema.parse({
            email: formData.get('email'),
            password: formData.get('password')
        })

        await signIn('credentials', user)
        return { success: true, message: 'Signed in successfully' }
    } catch (error) {
        if(isRedirectError(error)) {
            throw error;
        }

        return {
            success: false, message: 'Invalid email or password'
        }
    }
}

// Sign user out
export async function signOutUser() {
    // function from "@/auth", kills the cookie and token
    await signOut()
}

// Sign up user
// submitting with useActionState() hook - when use that, first argument is always prevState
export async function signUpUser(prevState: unknown, formData: FormData) {
    try {
        const user = signUpFormSchema.parse({
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
        })

        // plain password (before hashing)
        const plainPassword = user.password

        // hash the password and add it to the user object
        user.password = hashSync(user.password, 10)

        // save user to DB
        await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
            }
        })

        // Sign in the new user
        await signIn('credentials', {
            email: user.email,
            password: plainPassword
        })

        return { success: true, message: 'User registered successfully'}
    } catch (error) {
        if (isRedirectError(error)) {
            throw error
        }
        return { success: false, message: formatError(error)}
    }
}