Deno.test("TOP LAPTOP CI smoke test", () => {
  const storeName = "TOP LAPTOP ALGERIE";
  if (!storeName.includes("TOP LAPTOP")) {
    throw new Error("Invalid store name");
  }
});
