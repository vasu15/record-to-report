import "dotenv/config";
import { db } from "../server/db";
import { approvalSubmissions, poLines } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function clearAutoApprovals() {
  try {
    console.log("🧹 Clearing automated approval submissions...\n");
    
    // Get all existing approval submissions
    const existing = await db.select().from(approvalSubmissions);
    console.log(`Found ${existing.length} approval submissions to clear`);
    
    if (existing.length === 0) {
      console.log("✅ No approvals to clean up!");
      process.exit(0);
    }
    
    // Get affected PO line IDs
    const poLineIds = existing.map(a => a.poLineId);
    
    // Delete all approval submissions
    await db.delete(approvalSubmissions);
    console.log(`✅ Deleted ${existing.length} approval submissions`);
    
    // Reset PO statuses from "Submitted" back to "Draft"
    if (poLineIds.length > 0) {
      const affectedLines = await db.select()
        .from(poLines)
        .where(inArray(poLines.id, poLineIds));
      
      const submittedLines = affectedLines.filter(l => l.status === "Submitted");
      
      if (submittedLines.length > 0) {
        for (const line of submittedLines) {
          await db.update(poLines)
            .set({ status: "Draft" })
            .where(eq(poLines.id, line.id));
        }
        console.log(`✅ Reset ${submittedLines.length} PO lines from "Submitted" to "Draft"`);
      }
    }
    
    console.log("\n✨ Cleanup complete!");
    console.log("📋 System is now ready for manual approval submissions.");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  }
}

clearAutoApprovals();
