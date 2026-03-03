import { PrismaClient, AppRole, ProviderType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const features: Array<{ category: string; name: string; sortOrder: number }> = [
  { category: "🔵 Device Workflows", name: "Laptop Check-Out", sortOrder: 1 },
  { category: "🔵 Device Workflows", name: "Laptop Check-In", sortOrder: 2 },
  { category: "🔵 Device Workflows", name: "Permanent Device Assignment", sortOrder: 3 },
  { category: "🔵 Device Workflows", name: "Device Unassignment", sortOrder: 4 },
  { category: "🔵 Device Workflows", name: "Loaner Pool Management", sortOrder: 5 },
  { category: "🔵 Device Workflows", name: "Overdue Loaner Report", sortOrder: 6 },
  { category: "🔵 Device Workflows", name: "Device Swap", sortOrder: 7 },
  { category: "🟢 Repair & Maintenance Workflows", name: "Create Repair Ticket", sortOrder: 8 },
  { category: "🟢 Repair & Maintenance Workflows", name: "Update Repair Status", sortOrder: 9 },
  { category: "🟢 Repair & Maintenance Workflows", name: "Parts Request Log", sortOrder: 10 },
  { category: "🟢 Repair & Maintenance Workflows", name: "Repair Completion & Return", sortOrder: 11 },
  { category: "🟢 Repair & Maintenance Workflows", name: "Wipe/Reimage Log", sortOrder: 12 },
  { category: "🟡 Onboarding Workflows", name: "New Student Onboarding", sortOrder: 13 },
  { category: "🟡 Onboarding Workflows", name: "New Staff Onboarding", sortOrder: 14 },
  { category: "🟡 Onboarding Workflows", name: "Account Setup Checklist", sortOrder: 15 },
  { category: "🟡 Onboarding Workflows", name: "Bulk Onboarding", sortOrder: 16 },
  { category: "🔴 Offboarding Workflows", name: "Student Offboarding", sortOrder: 17 },
  { category: "🔴 Offboarding Workflows", name: "Staff Offboarding", sortOrder: 18 },
  { category: "🔴 Offboarding Workflows", name: "Transfer/Graduation Workflow", sortOrder: 19 },
  { category: "🟣 Account Management Workflows", name: "Password Reset Log", sortOrder: 20 },
  { category: "🟣 Account Management Workflows", name: "Google Group Assignment", sortOrder: 21 },
  { category: "🟣 Account Management Workflows", name: "Custom Field Update", sortOrder: 22 },
  { category: "🟣 Account Management Workflows", name: "Account Suspension/Reactivation", sortOrder: 23 },
  { category: "🟣 Account Management Workflows", name: "License Assignment", sortOrder: 24 },
  { category: "⚪ Accessories & Peripherals", name: "Accessory Check-Out", sortOrder: 25 },
  { category: "⚪ Accessories & Peripherals", name: "Accessory Check-In", sortOrder: 26 },
  { category: "⚪ Accessories & Peripherals", name: "Accessory Inventory Count", sortOrder: 27 },
  { category: "⚪ Accessories & Peripherals", name: "Lost/Damaged Report", sortOrder: 28 },
  { category: "📊 Reporting & Dashboard Views", name: "Daily Activity Log", sortOrder: 29 },
  { category: "📊 Reporting & Dashboard Views", name: "Currently Checked-Out Devices", sortOrder: 30 },
  { category: "📊 Reporting & Dashboard Views", name: "Open Repair Tickets", sortOrder: 31 },
  { category: "📊 Reporting & Dashboard Views", name: "Asset Search", sortOrder: 32 },
  { category: "📊 Reporting & Dashboard Views", name: "User Lookup", sortOrder: 33 },
  { category: "📊 Reporting & Dashboard Views", name: "Audit Trail", sortOrder: 34 },
  { category: "🔐 Access & Admin", name: "Role-Based Views", sortOrder: 35 },
  { category: "🔐 Access & Admin", name: "Technician Assignment", sortOrder: 36 },
  { category: "🔐 Access & Admin", name: "Announcement/Notes Board", sortOrder: 37 },
  { category: "🔐 Access & Admin", name: "Settings & Integration Config", sortOrder: 38 },
];

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@nomma.local" },
    update: {},
    create: { email: "admin@nomma.local", name: "Admin User", role: AppRole.ADMIN, passwordHash },
  });

  await prisma.user.upsert({
    where: { email: "tech@nomma.local" },
    update: {},
    create: { email: "tech@nomma.local", name: "Technician User", role: AppRole.TECHNICIAN, passwordHash },
  });

  await prisma.user.upsert({
    where: { email: "cadet@nomma.local" },
    update: {},
    create: { email: "cadet@nomma.local", name: "Cadet Helper", role: AppRole.CADET_HELPER, passwordHash },
  });

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: { category: feature.category, sortOrder: feature.sortOrder },
      create: feature,
    });
  }

  const assets = [
    { assetTag: "LN-1001", displayName: "Loaner ThinkPad 1", status: "AVAILABLE" as const },
    { assetTag: "LN-1002", displayName: "Loaner ThinkPad 2", status: "AVAILABLE" as const },
    { assetTag: "LN-1003", displayName: "Loaner MacBook 1", status: "IN_REPAIR" as const },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { assetTag: asset.assetTag },
      update: asset,
      create: asset,
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@nomma.local" } });

  await prisma.integrationConfig.upsert({
    where: { id: "default-config" },
    update: {},
    create: { id: "default-config", enableSharedCreds: true, updatedByUserId: admin.id },
  });

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: admin.id, provider: ProviderType.SNIPEIT } },
    update: {},
    create: {
      userId: admin.id,
      provider: ProviderType.SNIPEIT,
      encryptedAccessToken: "seeded-placeholder-token",
      status: "disconnected",
      isShared: false,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
