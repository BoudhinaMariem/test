export interface KpiCard { title: string; value: string; delta?: string; trend?: 'up' | 'down' | 'neutral'; }
export interface TeamMetric { equipe: string; charge: number; capacite: number; tauxRespect: number; }
export interface ProductionItem { dossier: string; client: string; activite: string; equipe: string; statut: string; dateCible: string; charge: number; retour: number; }
export interface AvailabilityItem { collaborateur: string; equipe: string; disponibilite: number; statut: string; }

export const dashboardKpis: KpiCard[] = [
    { title: 'Dossiers actifs', value: '248', delta: '+12%', trend: 'up' },
    { title: 'Respect délais', value: '91.8%', delta: '+2.1 pts', trend: 'up' },
    { title: 'Taux de retour', value: '6.4%', delta: '-0.8 pts', trend: 'up' },
    { title: 'Capacité restante', value: '132 h', delta: 'Cette semaine', trend: 'neutral' }
];

export const teamMetrics: TeamMetric[] = [
    { equipe: 'Web', charge: 88, capacite: 100, tauxRespect: 94 },
    { equipe: 'SEO', charge: 72, capacite: 90, tauxRespect: 89 },
    { equipe: 'Contenu', charge: 63, capacite: 80, tauxRespect: 92 },
    { equipe: 'Support', charge: 54, capacite: 70, tauxRespect: 96 }
];

export const productionItems: ProductionItem[] = [
    { dossier: 'TRI-2401', client: 'KBS Energie', activite: 'Site vitrine', equipe: 'Web', statut: 'En cours', dateCible: '2026-04-28', charge: 24, retour: 1 },
    { dossier: 'TRI-2402', client: 'Azur Menuiserie', activite: 'Refonte SEO', equipe: 'SEO', statut: 'Planifié', dateCible: '2026-04-30', charge: 16, retour: 0 },
    { dossier: 'TRI-2403', client: 'Clinique Atlas', activite: 'Landing page', equipe: 'Web', statut: 'En retard', dateCible: '2026-04-22', charge: 20, retour: 2 },
    { dossier: 'TRI-2404', client: 'Bati Sud', activite: 'Fiche GMB', equipe: 'Contenu', statut: 'Validé', dateCible: '2026-04-21', charge: 6, retour: 0 },
    { dossier: 'TRI-2405', client: 'Maison Beldi', activite: 'Campagne Meta', equipe: 'Support', statut: 'En cours', dateCible: '2026-05-02', charge: 14, retour: 0 }
];

export const monthlyEvolution = [
    { periode: 'Jan', production: 42, performance: 86 },
    { periode: 'Fev', production: 48, performance: 88 },
    { periode: 'Mar', production: 57, performance: 89 },
    { periode: 'Avr', production: 61, performance: 92 }
];

export const planningLoad = [
    { semaine: 'S17', web: 34, seo: 22, contenu: 17, support: 11 },
    { semaine: 'S18', web: 29, seo: 20, contenu: 18, support: 12 },
    { semaine: 'S19', web: 31, seo: 24, contenu: 15, support: 10 },
    { semaine: 'S20', web: 27, seo: 19, contenu: 13, support: 8 }
];

export const availabilityItems: AvailabilityItem[] = [
    { collaborateur: 'Meriem Ben Ali', equipe: 'Web', disponibilite: 76, statut: 'Disponible' },
    { collaborateur: 'Sami Gharbi', equipe: 'SEO', disponibilite: 61, statut: 'Disponible' },
    { collaborateur: 'Aya Trabelsi', equipe: 'Contenu', disponibilite: 38, statut: 'Charge haute' },
    { collaborateur: 'Hatem Mansour', equipe: 'Support', disponibilite: 0, statut: 'Absence' }
];

export const modelsItems = [
    { modele: 'Predict Delay v1', version: '1.2.0', statut: 'Prêt', usage: 'Retard dossiers', precision: 0.87 },
    { modele: 'Priority Scorer', version: '0.9.4', statut: 'Préparation', usage: 'Priorisation', precision: 0.81 },
    { modele: 'Assignment Reco', version: '0.3.1', statut: 'Backlog', usage: 'Affectation', precision: 0.0 }
];
