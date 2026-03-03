import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            lineItems: {
              include: {
                lineItem: {
                  include: {
                    unit: true,
                    workItem: true,
                  },
                },
                variant: true,
                unit: true,
              },
            },
          },
        },
        estimates: {
          include: {
            lineItems: {
              include: {
                lineItem: {
                  include: {
                    unit: true,
                    workItem: true,
                  },
                },
                variant: true,
                unit: true,
                room: true,
              },
            },
          },
        },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const project = await db.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        address: data.address,
        projectType: data.projectType,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        totalBudget: data.totalBudget,
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.project.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}