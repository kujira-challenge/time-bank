import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Fetch entries for the specified month
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
      .toISOString()
      .slice(0, 10);

    const { data: entries, error } = await supabase
      .from('entries')
      .select(
        `
        id,
        week_start,
        hours,
        tags,
        note,
        created_at,
        contributor:profiles!entries_contributor_id_fkey(display_name, email)
      `
      )
      .gte('week_start', startDate)
      .lt('week_start', endDate)
      .order('week_start', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate CSV
    const headers = ['週開始日', '時間', 'タグ', 'メモ', '貢献者', 'メール', '作成日時'];
    const rows = entries.map((entry: Record<string, unknown>) => {
      const contributor = entry.contributor as { display_name?: string; email?: string } | null;
      return [
        entry.week_start as string,
        entry.hours as number,
        ((entry.tags as string[]) || []).join('; '),
        ((entry.note as string) || '').replace(/"/g, '""'),
        contributor?.display_name || 'Unknown',
        contributor?.email || '',
        new Date(entry.created_at as string).toLocaleString('ja-JP'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="entries_${month}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
