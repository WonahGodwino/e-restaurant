import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditEvent, getActorFromKey } from '@/lib/audit';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === (process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY);
}

// POST /api/admin/users/import-csv - Import users from CSV
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    const csv = await file.text();
    const lines = csv.trim().split('\n');

    // First line should be header: email,name,role
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must contain header and at least one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
    if (!headers.includes('email') || !headers.includes('name') || !headers.includes('role')) {
      return NextResponse.json(
        { error: 'CSV must contain columns: email, name, role' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Parse and create users
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });

      const email = row.email?.toLowerCase();
      const name = row.name;
      const roleStr = row.role?.toUpperCase();

      if (!email || !name || !roleStr) {
        results.errors.push(`Row ${i + 1}: Missing required fields`);
        results.skipped++;
        continue;
      }

      if (!['ADMIN', 'MANAGER', 'COOK'].includes(roleStr)) {
        results.errors.push(`Row ${i + 1}: Invalid role "${roleStr}". Must be ADMIN, MANAGER, or COOK`);
        results.skipped++;
        continue;
      }

      try {
        // Check if user exists
        const existing = await db.user.findUnique({
          where: { email },
        });

        if (existing) {
          results.errors.push(`Row ${i + 1}: User with email ${email} already exists`);
          results.skipped++;
          continue;
        }

        // Create user
        const role = roleStr as 'ADMIN' | 'MANAGER' | 'COOK';
        const user = await db.user.create({
          data: {
            email,
            name,
            role,
          },
        });

        // Create default notification preferences
        const notificationTypes: ('LOW_STOCK' | 'NEW_ORDER' | 'ORDER_STATUS_CHANGE')[] = ['LOW_STOCK', 'NEW_ORDER', 'ORDER_STATUS_CHANGE'];
        await Promise.all(
          notificationTypes.map((type) =>
            db.notificationPreference.create({
              data: {
                userId: user.id,
                notificationType: type,
                emailEnabled: true,
                dashboardEnabled: true,
              },
            })
          )
        );

        results.created++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${String(error).slice(0, 50)}`);
        results.skipped++;
      }
    }

    const actor = getActorFromKey(request.headers.get('x-admin-key'));
    void logAuditEvent(actor, 'user.import_csv', 'User:bulk', {
      created: results.created,
      skipped: results.skipped,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}