const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.dev' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskflow.dev',
      password: adminPassword,
    },
  });

  // Create member user
  const memberPassword = await bcrypt.hash('Member@123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.dev' },
    update: {},
    create: {
      name: 'Jane Member',
      email: 'member@taskflow.dev',
      password: memberPassword,
    },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Product Launch',
      description: 'Q1 2025 product launch campaign',
      color: '#6366f1',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create sample tasks
  const tasks = [
    { title: 'Design landing page mockups', status: 'DONE', priority: 'HIGH', assigneeId: member.id },
    { title: 'Set up CI/CD pipeline', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Write API documentation', status: 'TODO', priority: 'MEDIUM', assigneeId: member.id },
    { title: 'User acceptance testing', status: 'TODO', priority: 'URGENT', dueDate: new Date(Date.now() - 86400000) },
    { title: 'Deploy to production', status: 'TODO', priority: 'URGENT', assigneeId: admin.id },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project.id,
        creatorId: admin.id,
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('📧 Admin: admin@taskflow.dev / Admin@123');
  console.log('📧 Member: member@taskflow.dev / Member@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
