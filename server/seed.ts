import { db } from "./db";
import { hashPassword } from "./auth";
import {
  users, userRoles, costCenterAssignments, systemConfig, rolePermissions, poLines
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("[seed] Database already seeded, skipping.");
    return;
  }

  console.log("[seed] Seeding database with demo data...");

  const adminHash = await hashPassword("Admin@123");
  const approverHash = await hashPassword("Approver@123");
  const userHash = await hashPassword("User@123");

  const [admin] = await db.insert(users).values({
    email: "admin@company.com",
    passwordHash: adminHash,
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    status: "Active",
  }).returning();

  const [approver] = await db.insert(users).values({
    email: "approver@company.com",
    passwordHash: approverHash,
    name: "Priya Sharma",
    phone: "+91 98765 43211",
    status: "Active",
  }).returning();

  const [bizUser] = await db.insert(users).values({
    email: "user@company.com",
    passwordHash: userHash,
    name: "Amit Patel",
    phone: "+91 98765 43212",
    status: "Active",
  }).returning();

  const [bizUser2] = await db.insert(users).values({
    email: "sanjay@company.com",
    passwordHash: userHash,
    name: "Sanjay Gupta",
    phone: "+91 98765 43213",
    status: "Active",
  }).returning();

  await db.insert(userRoles).values([
    { userId: admin.id, role: "Finance Admin" },
    { userId: approver.id, role: "Finance Approver" },
    { userId: bizUser.id, role: "Business User" },
    { userId: bizUser2.id, role: "Business User" },
  ]);

  await db.insert(costCenterAssignments).values([
    { userId: bizUser.id, costCenter: "40030403" },
    { userId: bizUser.id, costCenter: "40030405" },
    { userId: bizUser2.id, costCenter: "40030410" },
    { userId: bizUser2.id, costCenter: "40030412" },
  ]);

  await db.insert(systemConfig).values([
    { configKey: "processing_month", configValue: "Feb 2026" },
    { configKey: "threshold_amount", configValue: "100000" },
    { configKey: "default_credit_gl", configValue: "50010011" },
  ]);

  const permissions = [
    { role: "Finance Admin", permission: "period_based", canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true },
    { role: "Finance Admin", permission: "activity_based", canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true },
    { role: "Finance Admin", permission: "non_po", canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true },
    { role: "Finance Admin", permission: "reports", canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false },
    { role: "Finance Admin", permission: "users", canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: false },
    { role: "Finance Admin", permission: "config", canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: false },
    { role: "Finance Approver", permission: "period_based", canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: true },
    { role: "Finance Approver", permission: "activity_based", canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true },
    { role: "Finance Approver", permission: "non_po", canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true },
    { role: "Finance Approver", permission: "reports", canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
    { role: "Finance Approver", permission: "users", canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
    { role: "Finance Approver", permission: "config", canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
    { role: "Business User", permission: "activity_based", canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: false },
    { role: "Business User", permission: "non_po", canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false },
  ];
  await db.insert(rolePermissions).values(permissions);

  const samplePOs = [
    { poNumber: "4500010001", poLineItem: "10", vendorName: "Tata Consultancy Services", itemDescription: "SAP Implementation - Phase 2 consulting", costCenter: "40030403", profitCenter: "IN01", glAccount: "50010011", startDate: "2025-10-01", endDate: "2026-06-30", netAmount: 4500000, plant: "IN01", category: "Period" as const },
    { poNumber: "4500010002", poLineItem: "10", vendorName: "Infosys Limited", itemDescription: "Cloud migration services", costCenter: "40030405", profitCenter: "IN02", glAccount: "50010012", startDate: "2025-11-15", endDate: "2026-05-15", netAmount: 3200000, plant: "IN01", category: "Period" as const },
    { poNumber: "4500010003", poLineItem: "10", vendorName: "Wipro Technologies", itemDescription: "Data analytics platform license", costCenter: "40030403", profitCenter: "IN01", glAccount: "50010013", startDate: "2026-01-01", endDate: "2026-12-31", netAmount: 2800000, plant: "IN02", category: "Period" as const },
    { poNumber: "4500010004", poLineItem: "20", vendorName: "Accenture India", itemDescription: "Digital transformation advisory", costCenter: "40030410", profitCenter: "IN03", glAccount: "50010014", startDate: "2025-09-01", endDate: "2026-08-31", netAmount: 6000000, plant: "IN01", category: "Period" as const },
    { poNumber: "4500010005", poLineItem: "10", vendorName: "HCL Technologies", itemDescription: "Infrastructure managed services", costCenter: "40030412", profitCenter: "IN01", glAccount: "50010015", startDate: "2026-01-01", endDate: "2026-06-30", netAmount: 1800000, plant: "IN03", category: "Period" as const },
    { poNumber: "4500010006", poLineItem: "10", vendorName: "Deloitte India", itemDescription: "Compliance audit services Q1-Q2", costCenter: "40030403", profitCenter: "IN02", glAccount: "50010016", startDate: "2026-01-01", endDate: "2026-06-30", netAmount: 2400000, plant: "IN01", category: "Period" as const },
    { poNumber: "4500010007", poLineItem: "10", vendorName: "IBM India", itemDescription: "Mainframe support and maintenance", costCenter: "40030405", profitCenter: "IN01", glAccount: "50010017", startDate: "2025-07-01", endDate: "2026-06-30", netAmount: 5600000, plant: "IN02", category: "Period" as const },

    { poNumber: "4500020001", poLineItem: "10", vendorName: "Cognizant Technology", itemDescription: "Application testing - Sprint 5", costCenter: "40030403", profitCenter: "IN01", glAccount: "50020011", startDate: "", endDate: "", netAmount: 1500000, plant: "IN01", category: "Activity" as const },
    { poNumber: "4500020002", poLineItem: "10", vendorName: "Tech Mahindra", itemDescription: "Network equipment installation", costCenter: "40030410", profitCenter: "IN02", glAccount: "50020012", startDate: "", endDate: "", netAmount: 2200000, plant: "IN02", category: "Activity" as const },
    { poNumber: "4500020003", poLineItem: "20", vendorName: "Capgemini India", itemDescription: "Training program delivery", costCenter: "40030405", profitCenter: "IN03", glAccount: "50020013", startDate: "", endDate: "", netAmount: 800000, plant: "IN01", category: "Activity" as const },
    { poNumber: "4500020004", poLineItem: "10", vendorName: "KPMG Advisory", itemDescription: "Risk assessment consulting", costCenter: "40030412", profitCenter: "IN01", glAccount: "50020014", startDate: "", endDate: "", netAmount: 3100000, plant: "IN03", category: "Activity" as const },
    { poNumber: "4500020005", poLineItem: "10", vendorName: "L&T Infotech", itemDescription: "ERP module customization", costCenter: "40030403", profitCenter: "IN02", glAccount: "50020015", startDate: "", endDate: "", netAmount: 1900000, plant: "IN01", category: "Activity" as const },
  ];

  for (const po of samplePOs) {
    await db.insert(poLines).values({
      uniqueId: `${po.poNumber}-${po.poLineItem}-seed`,
      poNumber: po.poNumber,
      poLineItem: po.poLineItem,
      vendorName: po.vendorName,
      itemDescription: po.itemDescription,
      costCenter: po.costCenter,
      profitCenter: po.profitCenter,
      glAccount: po.glAccount,
      startDate: po.startDate,
      endDate: po.endDate,
      netAmount: po.netAmount,
      plant: po.plant,
      category: po.category,
      status: "Draft",
    });
  }

  console.log("[seed] Database seeded successfully with demo data.");
}
