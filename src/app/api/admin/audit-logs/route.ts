import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return Boolean(process.env.ADMIN_DASHBOARD_KEY) && key === process.env.ADMIN_DASHBOARD_KEY;
}

// GET /api/admin/audit-logs - List audit log entries
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const limitParam = searchParams.get('limit');
    const actionFilter = searchParams.get('action');
    const limit = Math.min(Math.max(1, Number(limitParam) || 100), 500);

    const logs = await db.auditLog.findMany({
      where: actionFilter ? { action: actionFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
