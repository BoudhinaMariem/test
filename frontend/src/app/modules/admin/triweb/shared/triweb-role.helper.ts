export interface TriwebRoleFilterOption {
    value: string;
    labelKey: string;
}

export const TRIWEB_ROLE_FILTER_OPTIONS: TriwebRoleFilterOption[] = [
    { value: 'Tous', labelKey: 'common.all' },
    { value: 'redacteur', labelKey: 'triweb.roles.redacteur' },
    { value: 'graphiste', labelKey: 'triweb.roles.graphiste' },
    { value: 'cqInterne', labelKey: 'triweb.roles.cqInterne' },
    { value: 'cqClient', labelKey: 'triweb.roles.cqClient' }
];

export const TRIWEB_ROLE_LABEL_KEYS: Record<string, string> = {
    redaction: 'triweb.roles.redaction',
    graphisme: 'triweb.roles.graphisme',
    cqInterne: 'triweb.roles.cqInterne',
    cqClient: 'triweb.roles.cqClient'
};

import {
    getSubTeamForChart,
    normalizeTeamName,
    resolveSubTeamRole,
    teamMergeKey
} from './triweb-team-chart.helper';

function formatTeamDisplayName(value: string): string
{
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*-\s*/g, '-');
}

export function buildDistinctTeamOptions(items: any[]): { teamR: string[]; teamG: string[] }
{
    const teamRMap = new Map<string, string>();
    const teamGMap = new Map<string, string>();

    items.forEach((item) => {
        (['teamR', 'teamG'] as const).forEach((field) => {
            const raw = String(item?.[field] || '').trim();

            if (!raw)
            {
                return;
            }

            const name = normalizeTeamName(raw);
            const role = resolveSubTeamRole(name);

            if (!role)
            {
                return;
            }

            const key = teamMergeKey(name);
            const label = formatTeamDisplayName(name);

            if (role === 'teamR')
            {
                teamRMap.set(key, label);
            }
            else
            {
                teamGMap.set(key, label);
            }
        });
    });

    const sortLabels = (map: Map<string, string>): string[] =>
        Array.from(map.values()).sort((a, b) => a.localeCompare(b));

    return {
        teamR: sortLabels(teamRMap),
        teamG: sortLabels(teamGMap)
    };
}
