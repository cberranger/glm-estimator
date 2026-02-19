import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List labor codes and crews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'crew' or 'individual'
    const search = searchParams.get('search');
    
    const where: Record<string, unknown> = {};
    
    if (type === 'crew') {
      where.isCrew = true;
    } else if (type === 'individual') {
      where.isCrew = false;
    }
    
    if (search) {
      where.OR = [
        { laborCode: { contains: search } },
        { codeName: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    const laborCodes = await db.laborCode.findMany({
      where,
      orderBy: [{ isCrew: 'asc' }, { laborCode: 'asc' }],
    });
    
    return NextResponse.json({
      laborItems: laborCodes.map(lc => ({
        id: lc.id,
        laborCode: lc.laborCode,
        codeName: lc.codeName,
        description: lc.description,
        baseHourlyRate: lc.baseHourlyRate,
        isCrew: lc.isCrew,
        type: lc.isCrew ? 'Crew' : 'Individual',
      })),
      trades: [
        { name: 'Carpenters', count: laborCodes.filter(l => l.laborCode.startsWith('CARP') || l.laborCode.startsWith('CREW-FRAM')).length },
        { name: 'Electricians', count: laborCodes.filter(l => l.laborCode.startsWith('ELEC')).length },
        { name: 'Plumbers', count: laborCodes.filter(l => l.laborCode.startsWith('PLMB')).length },
        { name: 'HVAC', count: laborCodes.filter(l => l.laborCode.startsWith('HVAC')).length },
        { name: 'Masons', count: laborCodes.filter(l => l.laborCode.startsWith('MASN') || l.laborCode.startsWith('CREW-MASN')).length },
        { name: 'Painters', count: laborCodes.filter(l => l.laborCode.startsWith('PAIN') || l.laborCode.startsWith('CREW-PAIN')).length },
        { name: 'Roofers', count: laborCodes.filter(l => l.laborCode.startsWith('ROOF') || l.laborCode.startsWith('CREW-ROOF')).length },
        { name: 'Flooring', count: laborCodes.filter(l => l.laborCode.startsWith('FLOR') || l.laborCode.startsWith('CREW-FLOR')).length },
        { name: 'Drywallers', count: laborCodes.filter(l => l.laborCode.startsWith('DRYW') || l.laborCode.startsWith('CREW-DRYW')).length },
        { name: 'Ironworkers', count: laborCodes.filter(l => l.laborCode.startsWith('IRON')).length },
        { name: 'Laborers', count: laborCodes.filter(l => l.laborCode.startsWith('LAB')).length },
        { name: 'Equipment', count: laborCodes.filter(l => l.laborCode.startsWith('EQUIP') || l.laborCode.startsWith('CREW-EXCA') || l.laborCode.startsWith('CREW-CONC')).length },
      ],
    });
  } catch (error) {
    console.error('Error fetching labor:', error);
    return NextResponse.json({ error: 'Failed to fetch labor' }, { status: 500 });
  }
}
