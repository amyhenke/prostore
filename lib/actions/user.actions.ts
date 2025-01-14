"use server"

import { signInFormSchema } from "../validators"
import { signIn, signOut } from "@/auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"

// Sign in user with credentials
// when we create the form we're gunna use a new react hook called UseActionState() - when submit an action with that hook need prevState as first argument
export async function signInWithCredentials(prevState: unknown, formData: formData) {
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