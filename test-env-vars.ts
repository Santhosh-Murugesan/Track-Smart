import dotenv from "dotenv";
dotenv.config();

console.log("--- ENVIRONMENT VARIABLES ---");
for (const key of Object.keys(process.env)) {
  if (key.includes("GOOGLE") || key.includes("FIREBASE") || key.includes("CREDENTIALS") || key.includes("ACCOUNT")) {
    console.log(`${key}: ${process.env[key] ? "DEFINED (length " + process.env[key]?.length + ")" : "UNDEFINED"}`);
  }
}
