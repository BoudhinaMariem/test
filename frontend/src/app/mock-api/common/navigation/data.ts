/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id      : 'triweb',
        title   : 'Triweb Pilotage',
        subtitle: 'Dashboard et planification',
        type    : 'group',
        icon    : 'heroicons_outline:home',
        children: [
            { id: 'triweb.dashboard', title: 'Dashboard général', type: 'basic', icon: 'heroicons_outline:chart-square-bar', link: '/triweb/dashboard' },
            { id: 'triweb.planification', title: 'Planification', type: 'basic', icon: 'heroicons_outline:calendar', link: '/triweb/planification' },
            { id: 'triweb.powerbi', title: 'Power BI', type: 'basic', icon: 'heroicons_outline:presentation-chart-bar', link: '/triweb/powerbi' },
            { id: 'triweb.models', title: 'Modèles IA', type: 'basic', icon: 'heroicons_outline:chip', link: '/triweb/models' }
        ]
    }
];

export const compactNavigation: FuseNavigationItem[] = [
    { id: 'triweb.dashboard', title: 'Dashboard général', type: 'basic', icon: 'heroicons_outline:chart-square-bar', link: '/triweb/dashboard' },
    { id: 'triweb.planification', title: 'Planification', type: 'basic', icon: 'heroicons_outline:calendar', link: '/triweb/planification' },
    { id: 'triweb.powerbi', title: 'Power BI', type: 'basic', icon: 'heroicons_outline:presentation-chart-bar', link: '/triweb/powerbi' },
    { id: 'triweb.models', title: 'Modèles IA', type: 'basic', icon: 'heroicons_outline:chip', link: '/triweb/models' }
];

export const futuristicNavigation: FuseNavigationItem[] = defaultNavigation;
export const horizontalNavigation: FuseNavigationItem[] = compactNavigation;
