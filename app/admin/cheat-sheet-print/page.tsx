import React from "react";
import { PrintLayout, PrintPage } from "@/components/cheat-sheet/PrintLayout";
import { CheatSheetPage1 } from "@/components/cheat-sheet/CheatSheetPage1";
import { CheatSheetPage2 } from "@/components/cheat-sheet/CheatSheetPage2";
import { CheatSheetPage3 } from "@/components/cheat-sheet/CheatSheetPage3";
import { CheatSheetPage4 } from "@/components/cheat-sheet/CheatSheetPage4";
import { CheatSheetPage5 } from "@/components/cheat-sheet/CheatSheetPage5";

export default function CheatSheetPrintPage() {
    return (
        <PrintLayout>
            <PrintPage pageNumber={1} totalPages={5}>
                <CheatSheetPage1 />
            </PrintPage>

            <PrintPage pageNumber={2} totalPages={5}>
                <CheatSheetPage2 />
            </PrintPage>

            <PrintPage pageNumber={3} totalPages={5}>
                <CheatSheetPage3 />
            </PrintPage>

            <PrintPage pageNumber={4} totalPages={5}>
                <CheatSheetPage4 />
            </PrintPage>

            <PrintPage pageNumber={5} totalPages={5}>
                <CheatSheetPage5 />
            </PrintPage>
        </PrintLayout>
    );
}
