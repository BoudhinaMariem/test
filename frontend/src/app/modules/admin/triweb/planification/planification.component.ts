import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TriwebApiService } from '../triweb-api.service';

@Component({selector: 'triweb-planification', templateUrl: './planification.component.html', encapsulation: ViewEncapsulation.None})
export class TriwebPlanificationComponent implements OnInit {
    title = 'Planification';
    subtitle = 'Interface dédiée à la charge, aux échéances et aux alertes de retard par équipe.';
    readonly triwebPalette = ['#EA7862', '#9C0F48', '#737373', '#F4B183', '#4C7C9A', '#54B399', '#8E6C88'];
    readonly teamOptions = ['Tous', 'Rédacteur', 'Graphiste', 'CQ interne', 'CQ client'];

    planningLoad: any[] = [];
    availabilityItems: any[] = [];
    allItems: any[] = [];
    filteredItems: any[] = [];

    apiColumns: any[] = [];

    loading = false; 
    apiLoaded = false; 
    search = '';
    selectedStatut = 'Tous'; 
    selectedPosition = 'Tous'; 
    selectedLoiHamon = 'Tous'; 
    selectedNature = 'Tous'; 
    selectedTeam = 'Tous'; 
    dateFrom = ''; 
    dateTo = '';
    statutOptions: string[] = ['Tous']; 
    positionOptions: string[] = ['Tous']; 
    loiHamonOptions: string[] = ['Tous']; 
    natureOptions: string[] = ['Tous'];
    projects: any[] = []; 
    summaryCards: any[] = []; delayKpis: any[] = []; occupationEquipes: any[] = []; echeanceData: any[] = []; receptionPlanningData: any[] = []; deliveryPlanningData: any[] = []; lateItems: any[] = []; retourItems: any[] = []; chargeByActorData: any[] = [];

    constructor(private _triwebApiService: TriwebApiService) {}
    ngOnInit(): void {
        this.refreshPlanification();
    }

    refreshPlanification(): void {
    this.loading = true;

    this._triwebApiService.getItems().subscribe({
        next: (items) => {
    this.allItems = Array.isArray(items) ? items : [];

    console.log('[Planification] dossiers API reçus =', this.allItems.length);

    this.apiLoaded = true;
    this._buildOptions();
    this.applyFilters();

    this.loading = false;
},
        error: (error) => {
            console.error('[Planification] erreur API items', error);

            this.apiLoaded = false;
            this.allItems = [];
            this.filteredItems = [];
            this.projects = [];
            this.apiColumns = [];
            this.summaryCards = [];
            this.delayKpis = [];
            this.occupationEquipes = [];
            this.echeanceData = [];
            this.receptionPlanningData = [];
            this.deliveryPlanningData = [];
            this.lateItems = [];
            this.retourItems = [];
            this.chargeByActorData = [];

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
                && (this.selectedStatut === 'Tous' || this._norm(item.statut) === this._norm(this.selectedStatut) || this._norm(item.planProd) === this._norm(this.selectedStatut))
                && (this.selectedPosition === 'Tous' || this._norm(this._position(item)) === this._norm(this.selectedPosition))
                && (this.selectedLoiHamon === 'Tous' || this._norm(item.loiHamon) === this._norm(this.selectedLoiHamon))
                && (this.selectedNature === 'Tous' || this._norm(item.nature) === this._norm(this.selectedNature))
                && (this.selectedTeam === 'Tous' || this._matchesRole(item, this.selectedTeam))
                && dateOk;
        });
        this._recalculatePlanning();
    }

    resetFilters(): void { this.search = ''; this.selectedStatut = 'Tous'; this.selectedPosition = 'Tous'; this.selectedLoiHamon = 'Tous'; this.selectedNature = 'Tous'; this.selectedTeam = 'Tous'; this.dateFrom = ''; this.dateTo = ''; this.applyFilters(); }
    getDossierAlert(item: any): 'green' | 'orange' | 'red' { return this._getOperationalDelay(item).level; }

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


    private _recalculatePlanning(): void {
        const items = this.filteredItems;
        const totalPages = items.reduce((sum, item) => sum + Number(item.page || 0), 0);
        const redactionHours = Math.round(items.reduce((sum, item) => sum + Number(item.dureeRHours || item.charge || 0), 0));
        const graphismeHours = Math.round(items.reduce((sum, item) => sum + Number(item.dureeGHours || 0), 0));
        const productionAffected = items.filter((item) => this._isProductionAffected(item)).length;
        const notAffected = items.filter((item) => !this._hasAnyAffectedState(item)).length;
        const urgent = items.filter((item) => Number(item.priorite || 0) >= 3 || ['Livraison J', 'Livraison J+1'].includes(item.livraison)).length;
        this.summaryCards = [
            { title: 'Dossiers à planifier', value: `${notAffected}`, detail: 'Aucun état R/G/CQ affecté', tone: notAffected > 0 ? 'orange' : 'green' },
            { title: 'Dossiers production affectés', value: `${productionAffected}`, detail: 'Position Production + état affecté', tone: 'green' },
            { title: 'Pages à livrer', value: `${totalPages}`, detail: 'Volume pages sur livraisons prévues', tone: 'neutral' },
            { title: 'Urgences planning', value: `${urgent}`, detail: 'Priorité ou livraison courte', tone: urgent > 0 ? 'red' : 'green' },
            { title: 'Charge rédaction', value: `${redactionHours} h`, detail: 'Base 2 jours / 16h par dossier', tone: 'neutral' },
            { title: 'Charge graphisme', value: `${graphismeHours} h`, detail: 'Base 1 jour / 8h par dossier', tone: 'neutral' }
        ];
        this.planningLoad = this._groupByWeek(items); 
        this.occupationEquipes = this._groupByRole(items); 
        this.echeanceData = this._groupByDelivery(items); 
        this.projects = items;
        this._buildPlanningContent(items);
    }

    private _groupByWeek(items: any[]): any[] { const map = new Map<string, any>(); items.forEach((item) => { const date = this._getItemDate(item) || new Date(); const key = `S${this._weekNumber(date)}`; const current = map.get(key) || { semaine: key, redaction: 0, graphisme: 0, cqi: 0, cqc: 0, dossiers: 0 }; current.redaction += Number(item.dureeRHours || item.charge || 0); current.graphisme += Number(item.dureeGHours || 0); current.cqi += Number(item.dureeCqiHours || 0); current.cqc += Number(item.dureeCqcHours || 0); current.dossiers += 1; map.set(key, current); }); return Array.from(map.values()).sort((a, b) => a.semaine.localeCompare(b.semaine)).slice(0, 12); }
    private _groupByRole(items: any[]): any[] { const roles = [{ equipe: 'Rédacteur', durationField: 'dureeRHours' }, { equipe: 'Graphiste', durationField: 'dureeGHours' }, { equipe: 'CQ interne', durationField: 'dureeCqiHours' }, { equipe: 'CQ client', durationField: 'dureeCqcHours' }]; return roles.map((role) => { const roleItems = items.filter((item) => this._matchesRole(item, role.equipe)); const charge = roleItems.reduce((sum, item) => sum + Number(item[role.durationField] || 0), 0); return { equipe: role.equipe, occupation: Math.min(100, Math.round((charge / Math.max(1, roleItems.length * 8)) * 100)), dossiers: roleItems.length, charge: Math.round(charge * 100) / 100 }; }); }
    private _groupByDelivery(items: any[]): any[] { const map = new Map<string, any>(); items.forEach((item) => { const label = item.dateLivraisonPrevueIso || item.dateLivraisonPrevue || 'Sans date'; const current = map.get(label) || { label, pages: 0, charge: 0 }; current.pages += Number(item.page || 0); current.charge += Number(item.totalHours || item.charge || 0); map.set(label, current); }); return Array.from(map.values()).sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(0, 20); }
    private _groupByDate(items: any[], isoField: string, labelField: string): any[] { const map = new Map<string, any>(); items.forEach((item) => { const label = item[isoField] || item[labelField] || 'Sans date'; const current = map.get(label) || { label, charge: 0, pages: 0 }; current.charge += Number(item.charge || 0); current.pages += Number(item.page || 0); map.set(label, current); }); return Array.from(map.values()).sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(0, 30); }

    private _buildPlanningContent(items: any[]): void {
        this.receptionPlanningData = this._groupByDate(items, 'dateReceptionIso', 'dateReception'); this.deliveryPlanningData = this._groupByDelivery(items);
        this.lateItems = items.map((item) => ({...item, alertLevel: this.getDossierAlert(item), alertReason: this._getOperationalDelay(item).reason})).filter((item) => item.alertLevel === 'red').slice(0, 50);
        this.retourItems = items.filter((item) => this._hasRetourCq(item)).slice(0, 50); this.chargeByActorData = this._buildChargeByActor(items); this.delayKpis = this._buildDelayKpis(items);
    }

    private _buildChargeByActor(items: any[]): any[] { const map = new Map<string, any>(); items.forEach((item) => { [{ role: 'Rédacteur', name: item.redacteur, hours: item.dureeRHours, state: item.etatR }, { role: 'Graphiste', name: item.graphiste, hours: item.dureeGHours, state: item.etatG }, { role: 'CQ interne', name: item.cqinterne, hours: item.dureeCqiHours, state: item.etatCqi }, { role: 'CQ client', name: item.cqclient, hours: item.dureeCqcHours, state: item.etatCqc }].forEach((actor) => { const name = String(actor.name || '').trim(); if (!name || name.toLowerCase().includes('en instance')) { return; } const key = `${actor.role} - ${name}`; const current = map.get(key) || { actor: name, role: actor.role, dossiers: 0, hours: 0, retours: 0 }; current.dossiers += 1; current.hours += Number(actor.hours || 0); current.retours += this._isRetourValue(actor.state) ? 1 : 0; map.set(key, current); }); }); return Array.from(map.values()).map((x) => ({...x, hours: Math.round(x.hours * 100) / 100})).sort((a, b) => b.hours - a.hours).slice(0, 20); }

    private _buildDelayKpis(items: any[]): any[] {
        const total = items.length || 1;
        const redactionLate = items.filter((item) => this._getOperationalDelay(item).reason.includes('Rédacteur')).length;
        const graphismeLate = items.filter((item) => this._getOperationalDelay(item).reason.includes('Graphiste')).length;
        const late = items.filter((item) => this.getDossierAlert(item) === 'red').length;
        const warning = items.filter((item) => this.getDossierAlert(item) === 'orange').length;
        const onTime = items.filter((item) => this._isDeliveredOrValidatedOnTime(item)).length;
        const respectRate = Math.round((onTime / total) * 1000) / 10;
        const lateRate = Math.round((late / total) * 1000) / 10;
        return [
            { title: 'Respect date client', value: `${respectRate}%`, detail: `${onTime} livraisons validées ou livrées à temps`, status: respectRate >= 90 ? 'green' : respectRate >= 75 ? 'orange' : 'red' },
            { title: 'Retards rédaction', value: `${redactionLate}`, detail: 'État R en cours/en pause à J-1', status: redactionLate === 0 ? 'green' : redactionLate <= 5 ? 'orange' : 'red' },
            { title: 'Retards graphisme', value: `${graphismeLate}`, detail: 'État G en cours/en pause le jour J', status: graphismeLate === 0 ? 'green' : graphismeLate <= 5 ? 'orange' : 'red' },
            { title: 'Taux retard global', value: `${lateRate}%`, detail: `${late} retards + ${warning} alertes proches`, status: lateRate <= 5 ? 'green' : lateRate <= 15 ? 'orange' : 'red' }
        ];
    }

    private _weekNumber(date: Date): number { const firstDay = new Date(date.getFullYear(), 0, 1); const days = Math.floor((date.getTime() - firstDay.getTime()) / 86400000); return Math.ceil((days + firstDay.getDay() + 1) / 7); }
    private _getItemDate(item: any): Date | null { const value = item.dateLivraisonPrevueIso || item.dateLivraisonIso || item.dateReceptionIso || item.debutRIso; if (value) { const date = new Date(value); return isNaN(date.getTime()) ? null : date; } return null; }
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
    private _isDeliveredOrValidatedOnTime(item: any): boolean { if (!this._isFinalized(item) || !item.dateLivraisonPrevueIso) { return false; } const due = new Date(item.dateLivraisonPrevueIso); const delivered = item.dateLivraisonIso ? new Date(item.dateLivraisonIso) : due; if (isNaN(due.getTime()) || isNaN(delivered.getTime())) { return false; } due.setHours(23, 59, 59, 999); delivered.setHours(0, 0, 0, 0); return delivered <= due; }
    private _hasRetourCq(item: any): boolean { return [item.statut, item.position, item.postion, item.planR, item.planG, item.planCqi, item.planCqc, item.etatR, item.etatG, item.etatCqi, item.etatCqc].some((value) => this._isRetourValue(value)); }
    private _isRetourValue(value: any): boolean { const n = this._norm(value); return n.includes('retour cq') || n.includes('retour cq traité') || n.includes('non conforme'); }
    private _matchesRole(item: any, role: string): boolean { const n = this._norm(role); if (n === 'rédacteur' || n === 'redacteur') { return this._roleHasWork(item.redacteur, item.etatR, item.planR); } if (n === 'graphiste') { return this._roleHasWork(item.graphiste, item.etatG, item.planG); } if (n === 'cq interne') { return this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi); } if (n === 'cq client') { return this._roleHasWork(item.cqclient, item.etatCqc, item.planCqc); } return false; }
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
