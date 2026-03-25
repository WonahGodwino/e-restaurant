import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent, getActorFromKey } from '@/lib/audit';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === process.env.ADMIN_DASHBOARD_KEY;
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'COOK']),
});

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create single user
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data,
    });

    // Create default notification preferences
    const notificationTypes = ['LOW_STOCK', 'NEW_ORDER', 'ORDER_STATUS_CHANGE'];
    await Promise.all(
      notificationTypes.map((type) =>
        db.notificationPreference.create({
          data: {
            userId: user.id,
            notificationType: type as 'LOW_STOCK' | 'NEW_ORDER' | 'ORDER_STATUS_CHANGE',
            emailEnabled: true,
            dashboardEnabled: true,
          },
        })
      )
    );

    const actor = getActorFromKey(request.headers.get('x-admin-key'));
    void logAuditEvent(actor, 'user.create', `User:${user.id}`, {
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
