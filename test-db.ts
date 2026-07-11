import { db } from "./db";

async function test() {
  const result = await db.execute("SELECT 1");
  console.log(result);
}

test();