const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.update({ where: { id: 'user-mw-t-29' }, data: { firstName: 'Mokgadi Patience' } })
  .then(() => console.log('Updated: Mokgadi Patience Kgatle'))
  .finally(() => p.$disconnect());
