export type TriwebTeamField = 'teamR' | 'teamG';

export interface TriwebTeamContentRow {
    team: string;
    count: number;
}

export interface TriwebTeamComparisonRow {
    team: string;
    teamR: number;
    teamG: number;
}

const TEAM_R_KEYS = ['teamR', 'TeamR', 'team_r', 'equipeR'];
const TEAM_G_KEYS = ['teamG', 'TeamG', 'team_g', 'equipeG'];

const TEAM_R_EXCLUDED = new Set([
    'cq client : non affecte',
    'ftp : non affecte'
]);

const TEAM_G_EXCLUDED = new Set([
    'cdc - en cours',
    'cdc - ok',
    'cdc en cours'
]);

function normTeamKey(value: string): string
{
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function isExcludedTeamValue(name: string, field: TriwebTeamField): boolean
{
    const key = normTeamKey(name);

    if (field === 'teamR')
    {
        return TEAM_R_EXCLUDED.has(key);
    }

    return TEAM_G_EXCLUDED.has(key);
}

export function normalizeTeamName(value: unknown): string
{
    const team = String(value ?? '').trim();

    if (!team || team === '-' || team.toLowerCase() === 'null')
    {
        return 'Non affecté';
    }

    return team;
}

export function getTeamFieldValue(item: any, field: TriwebTeamField): string | null
{
    const keys = field === 'teamR' ? TEAM_R_KEYS : TEAM_G_KEYS;

    for (const key of keys)
    {
        if (item && item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '')
        {
            const name = normalizeTeamName(item[key]);

            if (isExcludedTeamValue(name, field))
            {
                return null;
            }

            return name;
        }
    }

    return null;
}

export function buildTeamContentChart(items: any[], field: TriwebTeamField): TriwebTeamContentRow[]
{
    const map = new Map<string, number>();

    items.forEach((item) => {
        const name = getTeamFieldValue(item, field);

        if (!name)
        {
            return;
        }

        map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries())
        .map(([team, count]) => ({ team, count }))
        .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));
}

export function buildTeamComparisonChart(items: any[]): TriwebTeamComparisonRow[]
{
    const map = new Map<string, { teamR: number; teamG: number }>();

    const ensure = (team: string): { teamR: number; teamG: number } =>
    {
        if (!map.has(team))
        {
            map.set(team, { teamR: 0, teamG: 0 });
        }

        return map.get(team)!;
    };

    items.forEach((item) => {
        const teamR = getTeamFieldValue(item, 'teamR');
        const teamG = getTeamFieldValue(item, 'teamG');

        if (teamR)
        {
            ensure(teamR).teamR += 1;
        }

        if (teamG)
        {
            ensure(teamG).teamG += 1;
        }
    });

    return Array.from(map.entries())
        .map(([team, counts]) => ({
            team,
            teamR: counts.teamR,
            teamG: counts.teamG
        }))
        .filter((row) => row.teamR > 0 || row.teamG > 0)
        .sort((a, b) => (b.teamR + b.teamG) - (a.teamR + a.teamG) || a.team.localeCompare(b.team));
}
