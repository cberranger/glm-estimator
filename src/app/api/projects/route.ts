import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all projects
export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        rooms: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        address: data.address,
        projectType: data.projectType || 'renovation',
        status: data.status || 'draft',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        totalBudget: data.totalBudget || 0,
      },
      include: {
        rooms: true,
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
