import { PrismaClient, Role, AppStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create default system Tenant
  const tenantDefault = await prisma.tenant.upsert({
    where: { slug: 'fast-travel' },
    update: {},
    create: {
      name: 'مكتب السفر السريع',
      slug: 'fast-travel',
      settings: {
        officeAddress: 'الرياض، طريق الملك فهد، برج الفيصلية',
      },
    },
  });

  const tenantSystem = await prisma.tenant.upsert({
    where: { slug: 'system-hq' },
    update: {},
    create: {
      name: 'VisaFlow Platform HQ',
      slug: 'system-hq',
      settings: {
        officeAddress: 'Riyadh HQ',
      },
    },
  });

  // 2. Insert default platform subscription plan
  await prisma.subscription.create({
    data: {
      tenantId: tenantDefault.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
    },
  });

  // 3. Create platform users with bcrypt hashes
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@visaflow.ai' },
    update: {},
    create: {
      name: 'إدارة المنصة',
      email: 'super@visaflow.ai',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      tenantId: tenantSystem.id,
      isActive: true,
    },
  });

  const agencyAdmin = await prisma.user.upsert({
    where: { email: 'admin@visaflow.ai' },
    update: {},
    create: {
      name: 'عبد الرحمن القحطاني',
      email: 'admin@visaflow.ai',
      password: hashedPassword,
      role: Role.ADMIN,
      tenantId: tenantDefault.id,
      isActive: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'احمد@visaflow.ai' },
    update: {},
    create: {
      name: 'أحمد الحربي',
      email: 'احمد@visaflow.ai',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      tenantId: tenantDefault.id,
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'ali@gmail.com' },
    update: {},
    create: {
      name: 'علي منصور',
      email: 'ali@gmail.com',
      password: hashedPassword,
      role: Role.CUSTOMER,
      tenantId: tenantDefault.id,
      isActive: true,
    },
  });

  // 4. Create an initial application
  const app = await prisma.application.create({
    data: {
      appNumber: 'VF-2026-74921',
      customerId: customer.id,
      destination: 'فرنسا',
      travelDate: new Date('2026-08-15'),
      travelers: 4,
      status: AppStatus.UNDER_REVIEW,
      assignedToId: employee.id,
      tenantId: tenantDefault.id,
      extractedData: {
        fullName: 'ALI MANSOUR AL-ZAHRANI',
        passportNo: 'A2849104',
        nationality: 'SAUDI ARABIA',
        gender: 'MALE',
        dob: '1990-05-12',
        issueDate: '2022-04-10',
        expiryDate: '2032-04-09',
        confidence: {
          fullName: 99,
          passportNo: 98,
          nationality: 97,
          gender: 99,
          dob: 95,
          issueDate: 92,
          expiryDate: 98,
        },
      },
      travelAccommodation: {
        hotelName: 'Le Paris Hotel',
        hotelAddress: '15 Rue de Rivoli',
        hotelCity: 'Paris',
        hotelPhone: '+33140263456',
        checkInDate: '2026-08-15',
        checkOutDate: '2026-08-25',
        purposeOfTravel: 'Tourism',
      },
    },
  });

  // 5. Add initial audit log
  await prisma.auditLog.create({
    data: {
      applicationId: app.id,
      userId: employee.id,
      action: 'تغيير حالة الطلب للمراجعة وتحميل تفاصيل الحجز الفندقي',
      fromStatus: 'NEW_REQUEST',
      toStatus: 'UNDER_REVIEW',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
