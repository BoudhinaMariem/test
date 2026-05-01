import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TriwebApiService } from '../triweb-api.service';

@Component({selector: 'triweb-dashboard', templateUrl: './dashboard.component.html', encapsulation: ViewEncapsulation.None})
export class TriwebDashboardComponent implements OnInit {
    title = 'Dashboard général';
    subtitle = 'Vue consolidée des opérations Triweb avec recherche, filtres et graphiques dynamiques.';
    readonly triwebPalette = ['#EA7862', '#9C0F48', '#737373', '#F4B183', '#4C7C9A', '#54B399', '#8E6C88'];
    readonly teamOptions = ['Tous', 'Rédacteur', 'Graphiste', 'CQ interne', 'CQ client'];

    loading = false;
    apiLoaded = false;
    lastUpdate = new Date();
    search = '';
    selectedStatut = 'Tous';
    selectedPosition = 'Tous';
    selectedLoiHamon = 'Tous';
    selectedNature = 'Tous';
    selectedTeam = 'Tous';
    dateFrom = '';
    dateTo = '';

    apiColumns: any[] = [];

    allItems: any[] = [];
    filteredItems: any[] = [];
    criticalItems: any[] = [];

    statutOptions: string[] = ['Tous'];
    positionOptions: string[] = ['Tous'];
    loiHamonOptions: string[] = ['Tous'];
    natureOptions: string[] = ['Tous'];

    kpis: any[] = [];
    teamMetrics: any[] = [];
    dailyProduction: any[] = [];
    topRedacteurs: any[] = [];
    topGraphistes: any[] = [];
    deliveryData: any[] = [];
    affectedPositionData: any[] = [];
    retourByStepData: any[] = [];

    constructor(private _triwebApiService: TriwebApiService) {}

    ngOnInit(): void {
        this.refreshDashboard();
    }

    refreshDashboard(): void {
    this.loading = true;

    this._triwebApiService.getItems().subscribe({
        next: (items) => {
            this.allItems = this._normalizeApiItems(items);
            this.apiColumns = this._buildApiColumns(this.allItems);

            console.log('[Dashboard] dossiers API utilisés =', this.allItems.length);
            console.log('[Dashboard] colonnes API =', this.apiColumns.map((c) => c.dataField));

            this.apiLoaded = true;
            this._buildOptions();
            this.applyFilters();

            this.lastUpdate = new Date();
            this.loading = false;
        },
        error: (error) => {
            console.error('[Dashboard] erreur API items', error);

            this.apiLoaded = false;
            this.allItems = [];
            this.filteredItems = [];
            this.apiColumns = [];
            this.kpis = [];
            this.teamMetrics = [];
            this.dailyProduction = [];
            this.deliveryData = [];
            this.topRedacteurs = [];
            this.topGraphistes = [];
            this.affectedPositionData = [];
            this.retourByStepData = [];
            this.criticalItems = [];

            this.loading = false;
        }
    });
}

private _normalizeApiItems(items: any[]): any[] {
    return Array.isArray(items)
        ? items.map((item) => this._normalizeApiItem(item))
        : [];
}

private _normalizeApiItem(item: any): any {
    const position = this._apiValue(item, ['position', 'postion', 'planProd', 'livraison']);
    const codeClient = this._apiValue(item, ['codeClient', 'code', 'id', 'dossier']);
    const client = this._apiValue(item, ['client', 'rs', 'raisonSociale', 'name', 'nom']);
    const dateLivraisonPrevue = this._apiValue(item, [
        'dateLivraisonPrevue',
        'dateLivraisonPrevueIso',
        'dateLivraison',
        'livraisonPrevue',
        'dateLivraisonClient'
    ]);

    return {
        ...item,

        // Champs normalisés pour filtres, cartes et grilles
        codeClient,
        client,
        position,
        statut: this._apiValue(item, ['statut', 'status']),
        loiHamon: this._apiValue(item, ['loiHamon', 'loihamon', 'loi_hamon']),
        nature: this._apiValue(item, ['nature', 'typeNature']),
        page: Number(this._apiValue(item, ['page', 'pages', 'nbrPage', 'nbPages']) || 0),

        dateLivraisonPrevue,
        dateLivraisonPrevueIso: this._toIsoDate(dateLivraisonPrevue),

        dateLivraisonIso: this._toIsoDate(this._apiValue(item, [
            'dateLivraisonIso',
            'dateLivraison',
            'dateLivraisonReelle'
        ])),

        dateReceptionIso: this._toIsoDate(this._apiValue(item, [
            'dateReceptionIso',
            'dateReception',
            'reception'
        ])),

        redacteur: this._apiValue(item, ['redacteur', 'rédacteur', 'teamR', 'userR']),
        graphiste: this._apiValue(item, ['graphiste', 'teamG', 'userG']),
        cqinterne: this._apiValue(item, ['cqinterne', 'cqInterne', 'teamCqi', 'userCqi']),
        cqclient: this._apiValue(item, ['cqclient', 'cqClient', 'teamCqc', 'userCqc']),

        etatR: this._apiValue(item, ['etatR', 'planR']),
        etatG: this._apiValue(item, ['etatG', 'planG']),
        etatCqi: this._apiValue(item, ['etatCqi', 'planCqi']),
        etatCqc: this._apiValue(item, ['etatCqc', 'planCqc']),

        dureeRHours: Number(this._apiValue(item, ['dureeRHours', 'dureeR', 'chargeR']) || 16),
        dureeGHours: Number(this._apiValue(item, ['dureeGHours', 'dureeG', 'chargeG']) || 8),
        dureeCqiHours: Number(this._apiValue(item, ['dureeCqiHours', 'dureeCqi', 'chargeCqi']) || 0),
        dureeCqcHours: Number(this._apiValue(item, ['dureeCqcHours', 'dureeCqc', 'chargeCqc']) || 0)
    };
}

private _apiValue(item: any, fields: string[]): any {
    for (const field of fields) {
        if (item && item[field] !== null && item[field] !== undefined && String(item[field]).trim() !== '') {
            return item[field];
        }
    }

    return '';
}

private _toIsoDate(value: any): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return String(value);
    }

    return date.toISOString().substring(0, 10);
}

private _buildApiColumns(items: any[]): any[] {
    const keys = new Set<string>();

    items.forEach((item) => {
        Object.keys(item || {}).forEach((key) => keys.add(key));
    });

    const preferred = [
        'id',
        'code',
        'codeClient',
        'client',
        'rs',
        'loiHamon',
        'nature',
        'statut',
        'position',
        'postion',
        'livraison',
        'planProd',
        'page',
        'dateReception',
        'dateLivraisonPrevue',
        'redacteur',
        'etatR',
        'graphiste',
        'etatG',
        'cqinterne',
        'etatCqi',
        'cqclient',
        'etatCqc'
    ];

    const orderedKeys = [
        ...preferred.filter((key) => keys.has(key)),
        ...Array.from(keys).filter((key) => !preferred.includes(key)).sort()
    ];

    return orderedKeys.map((key) => ({
        dataField: key,
        caption: this._caption(key)
    }));
}

private _caption(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (x) => x.toUpperCase());
}

    applyFilters(): void {
        const term = this.search.trim().toLowerCase();
        const from = this.dateFrom ? new Date(this.dateFrom) : null;
        const to = this.dateTo ? new Date(this.dateTo) : null;
        this.filteredItems = this.allItems.filter((item) => {
            const haystack = [item.id, item.codeClient, item.client, item.rs, item.loiHamon, item.nature, item.statut, item.position, item.postion, item.planProd, item.teamR, item.teamG, item.redacteur, item.graphiste, item.cqinterne, item.cqclient, item.etatR, item.etatG, item.etatCqi, item.etatCqc, item.detail].join(' ').toLowerCase();
            const itemDate = this._getItemDate(item);
            const dateOk = (!from || (itemDate && itemDate >= from)) && (!to || (itemDate && itemDate <= to));
            return (!term || haystack.includes(term))
                && (this.selectedStatut === 'Tous' || this._norm(item.statut) === this._norm(this.selectedStatut))
                && (this.selectedPosition === 'Tous' || this._norm(this._position(item)) === this._norm(this.selectedPosition))
                && (this.selectedLoiHamon === 'Tous' || this._norm(item.loiHamon) === this._norm(this.selectedLoiHamon))
                && (this.selectedNature === 'Tous' || this._norm(item.nature) === this._norm(this.selectedNature))
                && (this.selectedTeam === 'Tous' || this._matchesRole(item, this.selectedTeam))
                && dateOk;
        });
        this._recalculateVisuals();
    }

    resetFilters(): void {
        this.search = ''; this.selectedStatut = 'Tous'; this.selectedPosition = 'Tous'; this.selectedLoiHamon = 'Tous'; this.selectedNature = 'Tous'; this.selectedTeam = 'Tous'; this.dateFrom = ''; this.dateTo = '';
        this.applyFilters();
    }

    getDossierAlert(item: any): 'green' | 'orange' | 'red' { return this._getOperationalDelay(item).level; }
    getDossierAlertReason(item: any): string { return this._getOperationalDelay(item).reason; }

    private _buildOptions(): void {
    this.statutOptions = this._uniqueValuesFromApi((item) => item.statut);
    this.positionOptions = this._uniqueValuesFromApi((item) => this._position(item));
    this.loiHamonOptions = this._uniqueValuesFromApi((item) => item.loiHamon);
    this.natureOptions = this._uniqueValuesFromApi((item) => item.nature);
}

    private _uniqueValuesFromApi(selector: (item: any) => any): string[] {
        const values = this.allItems
            .map(selector)
            .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
            .map((value) => String(value).trim());

        return ['Tous', ...Array.from(new Set(values)).sort()];
    }


    private _recalculateVisuals(): void {
        const items = this.filteredItems;
        const total = items.length;
        const affectedProduction = items.filter((item) => this._isProductionAffected(item)).length;
        const nonAffected = items.filter((item) => !this._hasAnyAffectedState(item)).length;
        const finalized = items.filter((item) => this._isFinalized(item)).length;
        const onTime = items.filter((item) => this._isDeliveredOrValidatedOnTime(item)).length;
        const late = items.filter((item) => this.getDossierAlert(item) === 'red').length;
        const respectRate = total ? Math.round((onTime / total) * 1000) / 10 : 0;
        const lateRate = total ? Math.round((late / total) * 1000) / 10 : 0;
        this.kpis = [
            { title: 'Total dossiers existants', value: `${total}`, delta: 'Périmètre filtré', trend: 'neutral' },
            { title: 'Total affectés production', value: `${affectedProduction}`, delta: 'Position Production + au moins un état affecté', trend: 'up' },
            { title: 'Total non affectés', value: `${nonAffected}`, delta: 'Aucun état R/G/CQ affecté', trend: nonAffected > 0 ? 'down' : 'up' },
            { title: 'Total dossiers finalisés', value: `${finalized}`, delta: 'Finalisé / validé / livré', trend: 'up' },
            { title: 'Respect livraison', value: `${respectRate}%`, delta: `${onTime} livrés ou validés à temps`, trend: respectRate >= 80 ? 'up' : 'down' },
            { title: 'Taux de retard', value: `${lateRate}%`, delta: `${late} alertes retard`, trend: lateRate > 10 ? 'down' : 'up' }
        ];
        this.dailyProduction = this._groupByDay(items);
        this.teamMetrics = this._groupByRole(items);
        this.deliveryData = this._groupPagesByDelivery(items);
        this.topRedacteurs = this._buildTopActors(items, 'redacteur', 'etatR', 'dureeRHours');
        this.topGraphistes = this._buildTopActors(items, 'graphiste', 'etatG', 'dureeGHours');
        this.affectedPositionData = this._buildAffectedByPosition(items);
        this.retourByStepData = this._buildRetourByStep(items);
        this.criticalItems = items.map((item) => ({...item, alertLevel: this.getDossierAlert(item), alertReason: this.getDossierAlertReason(item)}))
            .filter((item) => item.alertLevel === 'red' || this._hasRetourCq(item) || this._norm(item.statut).includes('non conforme') || Number(item.priorite || 0) >= 3).slice(0, 25);
    }

    private _groupByDay(items: any[]): any[] {
        const map = new Map<string, any>();
        items.forEach((item) => {
            const date = this._getItemDate(item);
            const key = date ? this._dateKey(date) : 'Sans date';
            const current = map.get(key) || { periode: key, production: 0, retours: 0, livres: 0 };
            current.production += 1; current.retours += this._hasRetourCq(item) ? 1 : 0; current.livres += this._isFinalized(item) ? 1 : 0;
            map.set(key, current);
        });
        return Array.from(map.values()).sort((a, b) => String(a.periode).localeCompare(String(b.periode))).slice(0, 31);
    }

    private _groupPagesByDelivery(items: any[]): any[] {
        const map = new Map<string, any>();
        items.forEach((item) => {
            const label = item.dateLivraisonPrevueIso || item.dateLivraisonPrevue || 'Sans date';
            const current = map.get(label) || { label, pages: 0 };
            current.pages += Number(item.page || 0); map.set(label, current);
        });
        return Array.from(map.values()).sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(0, 20);
    }

    private _groupByRole(items: any[]): any[] {
        const roles = [
            { equipe: 'Rédacteur', durationField: 'dureeRHours', stateField: 'etatR' },
            { equipe: 'Graphiste', durationField: 'dureeGHours', stateField: 'etatG' },
            { equipe: 'CQ interne', durationField: 'dureeCqiHours', stateField: 'etatCqi' },
            { equipe: 'CQ client', durationField: 'dureeCqcHours', stateField: 'etatCqc' }
        ];
        return roles.map((role) => {
            const roleItems = items.filter((item) => this._matchesRole(item, role.equipe));
            const retours = roleItems.filter((item) => this._norm(item[role.stateField]).includes('retour cq')).length;
            const charge = roleItems.reduce((sum, item) => sum + Number(item[role.durationField] || 0), 0);
            const fallbackCharge = role.equipe === 'Rédacteur' ? roleItems.reduce((sum, item) => sum + Number(item.charge || 0), 0) : 0;
            return { equipe: role.equipe, dossiers: roleItems.length, charge: Math.round((charge || fallbackCharge) * 100) / 100, retours };
        });
    }

    private _buildTopActors(items: any[], actorField: string, etatField: string, durationField: string): any[] {
        const map = new Map<string, any>();
        items.filter((item) => this.getDossierAlert(item) !== 'red').forEach((item) => {
            const actor = String(item[actorField] || '').trim();
            if (!actor || actor.toLowerCase().includes('en instance')) { return; }
            const current = map.get(actor) || { name: actor, dossiers: 0, pages: 0, duree: 0, retours: 0, retards: 0, score: 0 };
            current.dossiers += 1; current.pages += Number(item.page || 0); current.duree += Number(item[durationField] || 0);
            current.retours += this._isRetourValue(item[etatField]) || this._isRetourValue(item.statut) ? 1 : 0;
            current.retards += this.getDossierAlert(item) === 'red' ? 1 : 0;
            map.set(actor, current);
        });
        return Array.from(map.values()).map((x) => ({...x, dureeMoyenne: x.dossiers ? Math.round((x.duree / x.dossiers) * 100) / 100 : 0, pagesParHeure: x.duree > 0 ? Math.round((x.pages / x.duree) * 100) / 100 : x.pages, tauxRetour: x.dossiers ? Math.round((x.retours / x.dossiers) * 1000) / 10 : 0, score: this._actorScore(x)}))
            .sort((a, b) => a.retards - b.retards || a.retours - b.retours || b.score - a.score || b.pages - a.pages).slice(0, 10);
    }

    private _actorScore(actor: any): number { return Math.round(((actor.pagesParHeure * 10) + (actor.dossiers * 2) - (actor.tauxRetour * 3) - (actor.retards * 20)) * 100) / 100; }

    private _buildAffectedByPosition(items: any[]): any[] {
        const map = new Map<string, number>();
        items.filter((item) => this._position(item).toUpperCase() !== 'FTP').forEach((item) => { const position = this._position(item) || 'Non définie'; map.set(position, (map.get(position) || 0) + 1); });
        return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    }

    private _buildRetourByStep(items: any[]): any[] {
        return [
            { step: 'Rédaction', value: items.filter((x) => this._isRetourValue(x.etatR) || this._isRetourValue(x.planR)).length },
            { step: 'Graphisme', value: items.filter((x) => this._isRetourValue(x.etatG) || this._isRetourValue(x.planG)).length },
            { step: 'CQ interne', value: items.filter((x) => this._isRetourValue(x.etatCqi) || this._isRetourValue(x.planCqi)).length },
            { step: 'CQ client', value: items.filter((x) => this._isRetourValue(x.etatCqc) || this._isRetourValue(x.planCqc)).length }
        ];
    }

    private _getItemDate(item: any): Date | null { const value = item.dateLivraisonPrevueIso || item.dateLivraisonIso || item.dateReceptionIso || item.debutRIso; if (value) { const date = new Date(value); return isNaN(date.getTime()) ? null : date; } return null; }
    private _dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
    private _position(item: any): string {
        return String(
            item.position ||
            item.postion ||
            item.planProd ||
            item.livraison ||
            ''
        ).trim();
    }
    private _norm(value: any): string { return String(value || '').trim().toLowerCase(); }
    private _isActiveState(value: any): boolean { const state = this._norm(value); return state === 'en cours' || state === 'en pause'; }
    private _isAffectedState(value: any): boolean { return this._norm(value) === 'affecté'; }
    private _hasAnyAffectedState(item: any): boolean { return ['etatR', 'etatG', 'etatCqi', 'etatCqc', 'planR', 'planG', 'planCqi', 'planCqc'].some((field) => this._isAffectedState(item[field])); }
    private _isProductionAffected(item: any): boolean { return this._norm(this._position(item)) === 'production' && this._hasAnyAffectedState(item); }
    private _isFinalized(item: any): boolean { return [item.statut, item.etatR, item.etatG, item.etatCqi, item.etatCqc, item.planProd, item.livraison].some((value) => { const n = this._norm(value); return n.includes('finalisé') || n.includes('finalise') || n.includes('validé') || n.includes('valide') || n.includes('livré') || n.includes('livre'); }); }

    private _isDeliveredOrValidatedOnTime(item: any): boolean {
        if (!this._isFinalized(item) || !item.dateLivraisonPrevueIso) { return false; }
        const due = new Date(item.dateLivraisonPrevueIso);
        const delivered = item.dateLivraisonIso ? new Date(item.dateLivraisonIso) : due;
        if (isNaN(due.getTime()) || isNaN(delivered.getTime())) { return false; }
        due.setHours(23, 59, 59, 999); delivered.setHours(0, 0, 0, 0);
        return delivered <= due;
    }

    private _hasRetourCq(item: any): boolean { return [item.statut, item.position, item.postion, item.planR, item.planG, item.planCqi, item.planCqc, item.etatR, item.etatG, item.etatCqi, item.etatCqc].some((value) => this._isRetourValue(value)); }
    private _isRetourValue(value: any): boolean { const n = this._norm(value); return n.includes('retour cq') || n.includes('retour cq traité') || n.includes('non conforme'); }

    private _matchesRole(item: any, role: string): boolean {
        const n = this._norm(role);
        if (n === 'rédacteur' || n === 'redacteur') { return this._roleHasWork(item.redacteur, item.etatR, item.planR); }
        if (n === 'graphiste') { return this._roleHasWork(item.graphiste, item.etatG, item.planG); }
        if (n === 'cq interne') { return this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi); }
        if (n === 'cq client') { return this._roleHasWork(item.cqclient, item.etatCqc, item.planCqc); }
        return false;
    }
    private _roleHasWork(actor: any, etat: any, plan: any): boolean { const actorName = this._norm(actor); const states = [this._norm(etat), this._norm(plan)]; return (!!actorName && !actorName.includes('en instance')) || states.some((state) => state !== '' && !state.includes('en instance')); }

    private _getOperationalDelay(item: any): { level: 'green' | 'orange' | 'red'; reason: string } {
        if (this._isDeliveredOrValidatedOnTime(item)) { return { level: 'green', reason: 'Livré / validé à temps' }; }
        const due = item.dateLivraisonPrevueIso ? new Date(item.dateLivraisonPrevueIso) : null;
        if (!due || isNaN(due.getTime())) { return { level: 'orange', reason: 'Date livraison prévue manquante' }; }
        const today = new Date(); today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (this._isActiveState(item.etatR) && diffDays <= 1) { return { level: 'red', reason: 'Rédacteur en cours/en pause à J-1 de livraison' }; }
        if (this._isActiveState(item.etatG) && diffDays <= 0) { return { level: 'red', reason: 'Graphiste en cours/en pause le jour J de livraison' }; }
        if (!this._isFinalized(item) && diffDays < 0) { return { level: 'red', reason: 'Date livraison dépassée' }; }
        if (this._isActiveState(item.etatR) && diffDays <= 2) { return { level: 'orange', reason: 'Rédaction proche de la limite 2 jours' }; }
        if (this._isActiveState(item.etatG) && diffDays <= 1) { return { level: 'orange', reason: 'Graphisme proche de la limite 1 jour' }; }
        if (diffDays <= 2) { return { level: 'orange', reason: 'Livraison proche' }; }
        return { level: 'green', reason: 'Planning sous contrôle' };
    }

    
}
