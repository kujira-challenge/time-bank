import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';

const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  notes: z.string().optional(),
  due_on: z.string().optional(),
});

const envSchema = z.object({
  ASANA_PAT: z.string().min(1, 'ASANA_PAT is required'),
  ASANA_WORKSPACE_GID: z.string().min(1, 'ASANA_WORKSPACE_GID is required'),
  ASANA_PROJECT_GID: z.string().min(1, 'ASANA_PROJECT_GID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（招待制）
    try {
      await requireUser();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 入力データのバリデーション
    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid input data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { name, notes, due_on } = validationResult.data;

    // 環境変数のバリデーション
    const envVars = {
      ASANA_PAT: process.env.ASANA_PAT,
      ASANA_WORKSPACE_GID: process.env.ASANA_WORKSPACE_GID,
      ASANA_PROJECT_GID: process.env.ASANA_PROJECT_GID,
    };

    const envValidation = envSchema.safeParse(envVars);
    if (!envValidation.success) {
      const missingVars = envValidation.error.issues.map(issue => issue.path[0]);
      return NextResponse.json(
        { 
          ok: false, 
          error: `Missing environment variables: ${missingVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const { ASANA_PAT, ASANA_WORKSPACE_GID, ASANA_PROJECT_GID } = envValidation.data;

    // Asana APIへのリクエストデータを構築
    const taskData: Record<string, unknown> = {
      name,
      projects: [ASANA_PROJECT_GID],
      workspace: ASANA_WORKSPACE_GID,
    };

    if (notes) {
      taskData.notes = notes;
    }

    if (due_on) {
      taskData.due_on = due_on;
    }

    // Asana APIへのリクエスト
    const asanaResponse = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASANA_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: taskData }),
    });

    if (!asanaResponse.ok) {
      const errorBody = await asanaResponse.text();
      console.error('Asana API error:', asanaResponse.status, errorBody);
      
      return NextResponse.json(
        { 
          ok: false, 
          error: `Asana API error: ${asanaResponse.status} ${asanaResponse.statusText}`,
          details: errorBody
        },
        { status: asanaResponse.status }
      );
    }

    const asanaData = await asanaResponse.json();

    return NextResponse.json({
      ok: true,
      task: asanaData.data,
    });

  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}