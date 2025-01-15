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
        // REMOVE THIS ONE
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, user, trigger, token }: any) {
            // set the user ID from the token (JWT has a subject (sub property) on it that has the user ID)
            session.user.id = token.sub

            // have to explicitly forward this to the token or can't access it
            session.user.role = token.role
            session.user.name = token.name

            // console.log(token)
            // {
            //     name: 'Jane',
            //     email: 'admin@example.com',
            //     sub: '78ed0ca8-02c5-4da4-b15f-62a25ee3b23b',
            //     role: 'admin',
            //     iat: 1736893377,
            //     exp: 1739485377,
            //     jti: '1456bb9d-5878-4e48-bdd6-b0c945d52047'
            // }
            // ROLE now added

            // if there is an update, set the user name
            if (trigger === 'update') {
                // need to make sure that when they update their name in the DB, it also changes in the session
                session.user.name = user.name
            }
            
            return session
        },
        async jwt({ token, user, trigger, session }: any) {
            // assign user fields to token
            if (user) {
                token.role = user.role

                // if user has no name, use first part of email
                if(user.name === "NO_NAME") {
                    token.name = user.email!.split('@')[0]
                }

                // update the DB to reflect token name
                await prisma.user.update({
                    where: {id: user.id},
                    data: {name: token.name}
                })
            }
            return token
        }

    },
    // test: 1
} satisfies NextAuthConfig
// satsifies ensures that the object structures (this 'config' object) is compatible with this NextAuthConfig type (e.g. can't add things that aren't defined in NextAuthConfig)
// test: 1 added above shows error: Object literal may only specify known properties, and 'test' does not exist in type 'NextAuthConfig'.
// when added as test isn't defined in NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)