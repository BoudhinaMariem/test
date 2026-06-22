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

export function teamMergeKey(value: string): string
{
    return normTeamKey(value)
        .replace(/\s*-\s*/g, '-')
        .replace(/\s/g, '');
}

/**
 * Rédaction : SAViX-*, Aur@Nex, Vortex-Lab
 * Graphisme : Genix-*
 */
export function resolveSubTeamRole(name: string): TriwebTeamField | null
{
    const key = teamMergeKey(name);
    const normalized = normTeamKey(name);

    if (!key || normalized === 'non affecte' || normalized === '-')
    {
        return null;
    }

    if (TEAM_R_EXCLUDED.has(normalized) || TEAM_G_EXCLUDED.has(normalized))
    {
        return null;
    }

    if (key.startsWith('genix'))
    {
        return 'teamG';
    }

    if (
        key.startsWith('savix') ||
        key === 'aur@nex' ||
        key === 'vortex-lab'
    )
    {
        return 'teamR';
    }

    return null;
}

export function getSubTeamForChart(item: any, field: TriwebTeamField): string | null
{
    const teamR = getTeamFieldValue(item, 'teamR');
    const teamG = getTeamFieldValue(item, 'teamG');

    if (teamR && resolveSubTeamRole(teamR) === field)
    {
        return teamR;
    }

    if (teamG && resolveSubTeamRole(teamG) === field)
    {
        return teamG;
    }

    return null;
}

export function computeTeamChartsSharedMax(datasets: TriwebTeamContentRow[][]): number
{
    let max = 0;

    datasets.forEach((rows) => {
        rows.forEach((row) => {
            if (row.count > max)
            {
                max = row.count;
            }
        });
    });

    if (max <= 0)
    {
        return 10;
    }

    const step = max <= 12 ? 2 : max <= 50 ? 5 : 10;

    return Math.ceil((max * 1.05) / step) * step;
}

function formatTeamDisplayName(value: string): string
{
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*-\s*/g, '-');
}

function pickTeamDisplayLabel(current: string, candidate: string): string
{
    const formatted = formatTeamDisplayName(candidate);

    if (!current)
    {
        return formatted;
    }

    if (current.toUpperCase() === current && formatted.toUpperCase() !== formatted)
    {
        return formatted;
    }

    return current;
}

export function normalizeTeamName(value: unknown): string
{
    const team = formatTeamDisplayName(String(value ?? ''));

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
    const map = new Map<string, { team: string; count: number }>();

    const addTeam = (name: string | null): void =>
    {
        if (!name || resolveSubTeamRole(name) !== field)
        {
            return;
        }

        const key = teamMergeKey(name);
        const current = map.get(key);

        if (current)
        {
            current.count += 1;
            current.team = pickTeamDisplayLabel(current.team, name);
        }
        else
        {
            map.set(key, {
                team: formatTeamDisplayName(name),
                count: 1
            });
        }
    };

    items.forEach((item) => {
        addTeam(getTeamFieldValue(item, 'teamR'));
        addTeam(getTeamFieldValue(item, 'teamG'));
    });

    return Array.from(map.values())
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
