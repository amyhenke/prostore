import NextAuth from 'next-auth'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/db/prisma'
import Credentials from 'next-auth/providers/credentials'
import { compareSync } from 'bcrypt-ts-edge'
import type { NextAuthConfig } from 'next-auth'

export const config = {
    pages: {
        signIn: '/sign-in',
        error: '/sign-in'
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [Credentials({
        credentials: {
            email: {type: 'email'},
            password: {type: 'password'}
        },
        async authorize(credentials) {
            if(credentials == null) return null
            
            // find user in DB
            const user = await prisma.user.findFirst({
                where: {
                    email: credentials.email as string
                }
            })
            if(user && user.password) {
                // compareSync is from bcrypt package - takes in plain text password that is submitted and the hashed password in the DB to make sure they match before giving permissions to log in
                const isMatch = compareSync(credentials.password as string, user.password)

                // if password is correct, return user
                if(isMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            }
            // if user doesn't exist or password doesn't match, return null
            return null
        }
    })],
    callbacks: {
        // whenever a session is accessed, this runs
        async session({ session, user, trigger, token }: any) {
            // set the user ID from the token (JWT has a subject (sub property) on it that has the user ID)
            session.user.id = token.sub

            // if there is an update, set the user name
            if (trigger === 'update') {
                // need to make sure that when they update their name in the DB, it also changes in the session
                session.user.name = user.name
            }
            
            return session
        }
    },
    // test: 1
} satisfies NextAuthConfig
// satsifies ensures that the object structures (this 'config' object) is compatible with this NextAuthConfig type (e.g. can't add things that aren't defined in NextAuthConfig)
// test: 1 added above shows error: Object literal may only specify known properties, and 'test' does not exist in type 'NextAuthConfig'.
// when added as test isn't defined in NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)