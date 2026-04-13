import dotenv from "dotenv"
dotenv.config()
import { runQualityGate } from "../lib/production/qualityGate"

async function testIt() {
    try {
        console.log("Running quality gate...");
        const res = await runQualityGate({
            hook: "This is a hook",
            teachingPoints: ["Point 1", "Point 2"],
            cta: "Click here",
            clinicalGrounding: "Very grounded",
            platform: "IG",
            postType: "CAROUSEL"
        });
        console.log("Success:", res);
    } catch (e: any) {
        console.error("FAILED:");
        console.error(e.message);
        console.error(e.stack);
        console.error(e);
    }
}

testIt();
