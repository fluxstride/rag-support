import fs from "fs";
import { createResource } from "./src/lib/actions/resources";

const prospectusDirectory = "./prospectus.md";
const file = fs.readFileSync(prospectusDirectory, "utf-8");
// const fileStream = fs.createReadStream(prospectusDirectory, {
//   encoding: "utf-8",
// });
// console.log(file);

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split("-")
    .filter((i) => i !== "");
};
//
// const chunks = generateChunks(file);
// console.log({ chunks });

const run = async () => {
  {
    // for await (const chunk of fileStream) {
    //   console.log(chunk);
    //   const res = await createResource({ content: chunk });
    // }

    const chunks = generateChunks(file);

    chunks.forEach(async (chunk) => {
      console.log(chunk);

      await createResource({ content: chunk });
    });
  }
};

run();
