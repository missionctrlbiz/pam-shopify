import { createRequire } from "module";
const requireModule = createRequire(import.meta.url);

try {
    console.log("Attempting to load @resvg/resvg-js...");
    const { Resvg } = requireModule("@resvg/resvg-js");
    console.log("✅ Successfully loaded Resvg!");
    const svg = `<svg><text>Hello</text></svg>`;
    const r = new Resvg(svg, { fitTo: { mode: "width", value: 500 } });
    console.log("✅ Render setup successful!");
} catch (e) {
    console.error("❌ FAILED WITH ERROR:");
    console.error(e);
}
