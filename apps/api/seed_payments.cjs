/**
 * Seed payment records for PAID and PARTIALLY_PAID invoices
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID    = 'school-hartrog-001';
const RECORDED_BY  = 'user-admin-hartrog-001'; // school admin user

const METHODS = ['EFT', 'EFT', 'EFT', 'CASH', 'CARD', 'DEBIT_ORDER'];

function seededRand(seed, min, max) {
  const x = Math.sin(seed + 1) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

async function main() {
  const existing = await p.payment.count({ where: { schoolId: SCHOOL_ID } });
  if (existing > 0) {
    console.log(`${existing} payments already exist — skipping`);
    return;
  }

  // Find admin user
  const admin = await p.user.findFirst({ where: { schoolId: SCHOOL_ID, role: 'SCHOOL_ADMIN' } });
  if (!admin) { console.error('No SCHOOL_ADMIN found'); return; }
  console.log('Recording payments as:', admin.email);

  const invoices = await p.invoice.findMany({
    where: { schoolId: SCHOOL_ID, status: { in: ['PAID', 'PARTIALLY_PAID'] } },
    select: { id: true, totalAmount: true, paidAmount: true, status: true }
  });
  console.log(`Found ${invoices.length} invoices`);

  const paymentDates = [
    new Date('2026-01-20'), new Date('2026-02-05'),
    new Date('2026-02-18'), new Date('2026-03-03'),
    new Date('2026-03-25'), new Date('2026-04-08'),
  ];

  const payments = [];
  let rcNum = 1000;
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    const paid = Number(inv.paidAmount);
    if (paid <= 0) continue;

    const method  = METHODS[seededRand(i, 0, METHODS.length - 1)];
    const dateIdx = seededRand(i + 10, 0, paymentDates.length - 1);
    const date    = paymentDates[dateIdx];

    if (inv.status === 'PARTIALLY_PAID' && seededRand(i, 0, 2) > 0) {
      const firstPmt  = Math.round(paid * 0.6 * 100) / 100;
      const secondPmt = Math.round((paid - firstPmt) * 100) / 100;
      if (firstPmt > 0) {
        payments.push({ schoolId: SCHOOL_ID, invoiceId: inv.id, amount: firstPmt, paymentDate: date, paymentMethod: method, reference: `EFT-${Date.now()}-${i}A`, receiptNumber: `RCP${rcNum++}`, recordedById: admin.id });
      }
      if (secondPmt > 0) {
        const d2 = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
        payments.push({ schoolId: SCHOOL_ID, invoiceId: inv.id, amount: secondPmt, paymentDate: d2, paymentMethod: method, reference: `EFT-${Date.now()}-${i}B`, receiptNumber: `RCP${rcNum++}`, recordedById: admin.id });
      }
    } else {
      payments.push({ schoolId: SCHOOL_ID, invoiceId: inv.id, amount: paid, paymentDate: date, paymentMethod: method, reference: `EFT-${Date.now()}-${i}`, receiptNumber: `RCP${rcNum++}`, recordedById: admin.id });
    }
  }

  console.log(`Creating ${payments.length} payment records...`);
  let created = 0;
  const BATCH = 20;
  for (let i = 0; i < payments.length; i += BATCH) {
    await p.payment.createMany({ data: payments.slice(i, i + BATCH), skipDuplicates: true });
    created += Math.min(BATCH, payments.length - i);
  }
  console.log(`Created ${created} payment records`);

  const total = await p.payment.aggregate({ where: { schoolId: SCHOOL_ID }, _sum: { amount: true } });
  console.log(`Total payments: R${Number(total._sum.amount || 0).toFixed(2)}`);
}

main().catch(console.error).finally(() => p.$disconnect());
