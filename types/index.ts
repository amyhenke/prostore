// How would normally add a type
// export type Product = {
//     id: string;
//     name: string
//     etc.
// }

// BUT we're using Zod so don't need to specify types of each field since it will use the zod schema to infer those

import { z } from "zod";
import { insertProductsSchema, insertCartSchema, cartItemSchema } from "@/lib/validators";

// z.infer includes all the fields in the schema, then can add more below
export type Product = z.infer<typeof insertProductsSchema> & {
    id: string;
    rating: string;
    createdAt: Date;
}

export type Cart = z.infer<typeof insertCartSchema>
export type CartItem = z.infer<typeof cartItemSchema>