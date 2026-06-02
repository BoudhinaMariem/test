import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TriwebApiService } from '../triweb-api.service';

@Component({
    selector: 'triweb-planification',
    templateUrl: './planification.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TriwebPlanificationComponent implements OnInit {
    title = 'Planification';
    subtitle = 'Analyse des dossiers à planifier, échéances client, moyennes de pages et retards opérationnels.';

    readonly triwebPalette = [
        '#EA7862',
        '#9C0F48',
        '#737373',
        '#F4B183',
        '#4C7C9A',
        '#54B399',
        '#8E6C88'
    ];

    loading = false;
    apiLoaded = false;
    lastUpdate = new Date();

    search = '';
    dateFrom = '';
    dateTo = '';

    selectedStatut = 'Tous';
    selectedPosition = 'Tous';
    selectedLoiHamon = 'Tous';
    selectedNature = 'Tous';
    selectedTeam = 'Tous';

    allItems: any[] = [];
    filteredItems: any[] = [];

    statutOptions: string[] = ['Tous'];
    positionOptions: string[] = ['Tous'];
    loiHamonOptions: string[] = ['Tous'];
    natureOptions: string[] = ['Tous'];
    teamOptions: string[] = ['Tous', 'Rédacteur', 'Graphiste', 'CQ interne', 'CQ client'];

    summaryCards: any[] = [];

    todayPlanningByPosition: any[] = [];
    avgPagesByDeliveryDate: any[] = [];
    avgPagesByRole: any[] = [];
    statusPieData: any[] = [];
    lateItems: any[] = [];
    avgWorkloadByRole: any[] = [];

    constructor(private _triwebApiService: TriwebApiService) {}

    ngOnInit(): void {
        this.refreshPlanification();
    }

    refreshPlanification(): void {
        this.loading = true;

        this._triwebApiService.getItems().subscribe({
            next: (items) => {
                const source = Array.isArray(items) ? items : [];

                this.allItems = source.map((item) => this._normalizeApiItem(item));
                this.filteredItems = [...this.allItems];

                console.log('[Planification] dossiers API reçus =', this.allItems.length);
                console.log('[Planification] colonnes API =', Object.keys(source[0] || {}));

                this.apiLoaded = true;
                this.lastUpdate = new Date();

                this._buildOptions();
                this.applyFilters();

                this.loading = false;
            },
            error: (error) => {
                console.error('[Planification] erreur API items', error);

                this.apiLoaded = false;
                this.loading = false;

                this.allItems = [];
                this.filteredItems = [];

                this.summaryCards = [];
                this.todayPlanningByPosition = [];
                this.avgPagesByDeliveryDate = [];
                this.avgPagesByRole = [];
                this.statusPieData = [];
                this.lateItems = [];
            }
        });
    }

    resetFilters(): void {
        this.search = '';
        this.dateFrom = '';
        this.dateTo = '';

        this.selectedStatut = 'Tous';
        this.selectedPosition = 'Tous';
        this.selectedLoiHamon = 'Tous';
        this.selectedNature = 'Tous';
        this.selectedTeam = 'Tous';

        this.applyFilters();
    }

    applyFilters(): void {
        const term = this._norm(this.search);
        const from = this.dateFrom ? this._parseTriwebDate(this.dateFrom) : null;
        const to = this.dateTo ? this._parseTriwebDate(this.dateTo) : null;

        this.filteredItems = this.allItems.filter((item) => {
            const searchable = this._norm([
                item.id,
                item.codeClient,
                item.client,
                item.loiHamon,
                item.nature,
                item.statut,
                item.position,
                item.teamR,
                item.teamG,
                item.redacteur,
                item.graphiste,
                item.cqinterne,
                item.cqclient,
                item.etatR,
                item.etatG,
                item.etatCqi,
                item.etatCqc
            ].join(' '));

            if (term && !searchable.includes(term)) {
                return false;
            }

            if (this.selectedStatut !== 'Tous' && item.statut !== this.selectedStatut) {
                return false;
            }

            if (this.selectedPosition !== 'Tous' && item.position !== this.selectedPosition) {
                return false;
            }

            if (this.selectedLoiHamon !== 'Tous' && item.loiHamon !== this.selectedLoiHamon) {
                return false;
            }

            if (this.selectedNature !== 'Tous' && item.nature !== this.selectedNature) {
                return false;
            }

            if (this.selectedTeam !== 'Tous' && !this._matchesRole(item, this.selectedTeam)) {
                return false;
            }

            const itemDate = this._getPlanningDate(item);

            if (from && itemDate && itemDate < from) {
                return false;
            }

            if (to && itemDate && itemDate > to) {
                return false;
            }

            return true;
        });

        this._recalculateVisuals();
    }

    customizePieTooltip = (arg: any): any => {
        const value = arg.value || 0;
        const percent = arg.percent ? `${(arg.percent * 100).toFixed(1)}%` : '';

        return {
            text: `${arg.argumentText} : ${value} dossier(s)<br>${percent}`
        };
    };

   
    customizeAvgPagesTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText}<br>` +
                `Moyenne pages : ${arg.valueText}<br>` +
                `Dossiers : ${data.dossiers || 0}`
        };
    };

    customizeLateTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText}<br>` +
                `Dossiers : ${arg.valueText}<br>` +
                `Moyenne pages : ${data.avgPages || 0}`
        };
    };

    private _recalculateVisuals(): void {
        const items = this.filteredItems;

        this.summaryCards = this._buildSummaryCards(items);
        this.todayPlanningByPosition = this._buildTodayPlanningByPosition(items);
        this.avgPagesByDeliveryDate = this._buildAvgPagesByDeliveryDate(items);
        this.avgWorkloadByRole = this._buildAvgWorkloadByRole(items);        this.statusPieData = this._buildStatusPie(items);
        this.lateItems = this._buildLateItems(items);
    }

    private _buildAvgWorkloadByRole(items: any[]): any[] {
        const activeItems = items.filter((item) => {
            return !this._isFinalized(item) &&
                this._norm(item.position) !== 'client';
        });

        const roles = [
            {
                role: 'Rédaction',
                matcher: (item: any) => this._roleHasWork(item.redacteur, item.etatR, item.planR)
            },
            {
                role: 'Graphisme',
                matcher: (item: any) => this._roleHasWork(item.graphiste, item.etatG, item.planG)
            },
            {
                role: 'CQ interne',
                matcher: (item: any) => this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi)
            }
        ];

        return roles.map((role) => {
            const roleItems = activeItems.filter((item) => role.matcher(item));
            const totalPages = roleItems.reduce((sum, item) => sum + Number(item.page || 0), 0);

            return {
                role: role.role,
                dossiers: roleItems.length,
                totalPages,
                avgPages: roleItems.length ? this._round(totalPages / roleItems.length) : 0
            };
        });
    }
    customizeWorkloadTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText}<br>` +
                `Charge moyenne : ${arg.valueText} pages/dossier<br>` +
                `Dossiers actifs : ${data.dossiers || 0}<br>` +
                `Pages totales : ${data.totalPages || 0}`
        };
    };

    private _buildSummaryCards(items: any[]): any[] {
        const todayKey = this._dateKey(new Date());

        const todayItems = items.filter((item) => {
            return item.dateLivraisonPrevueIso === todayKey &&
                !this._isFinalized(item) &&
                this._norm(item.position) !== 'client';
        });

        const next7Days = items.filter((item) => {
            const due = this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee);

            if (!due || this._isFinalized(item)) {
                return false;
            }

            if (this._norm(item.position) === 'client') {
                return false;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + 7);

            return due >= today && due <= maxDate;
        });

        const late = this._buildLateItems(items);

        const productionItems = items.filter((item) => {
            return this._norm(item.position) === 'production' &&
                !this._isFinalized(item);
        });

        const retours = items.filter((item) => {
            return this._hasRetourCq(item) &&
                this._norm(item.position) !== 'client';
        });

        const avgPagesToday = this._avg(todayItems.map((x) => Number(x.page || 0)));
        const avgPagesNext7 = this._avg(next7Days.map((x) => Number(x.page || 0)));

        return [
            {
                title: 'À livrer aujourd’hui',
                value: todayItems.length,
                detail: `${avgPagesToday} pages moy.`,
                trend: todayItems.length > 0 ? 'down' : 'up'
            },
            {
                title: 'Échéances 7 jours',
                value: next7Days.length,
                detail: `${avgPagesNext7} pages moy.`,
                trend: next7Days.length > 0 ? 'neutral' : 'up'
            },
            {
                title: 'Retards internes',
                value: late.length,
                detail: 'Hors position Client',
                trend: late.length > 0 ? 'down' : 'up'
            },
            {
                title: 'En production',
                value: productionItems.length,
                detail: 'Dossiers non finalisés',
                trend: 'neutral'
            },
            {
                title: 'Moyenne pages',
                value: this._avg(items.map((x) => Number(x.page || 0))),
                detail: 'Périmètre filtré',
                trend: 'neutral'
            },
            {
                title: 'Retours CQ',
                value: retours.length,
                detail: 'Hors position Client',
                trend: retours.length > 0 ? 'down' : 'up'
            }
        ];
    }

    customizePlanningRoleTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText}<br>` +
                `Dossiers : ${data.dossiers || 0}<br>` +
                `Pages totales : ${data.pages || 0}<br>` +
                `Moyenne pages : ${data.avgPages || 0}`
        };
    };

    private _buildTodayPlanningByPosition(items: any[]): any[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);

        const roles = [
            {
                role: 'Rédaction',
                matcher: (item: any) => this._roleHasWork(item.redacteur, item.etatR, item.planR)
            },
            {
                role: 'Graphisme',
                matcher: (item: any) => this._roleHasWork(item.graphiste, item.etatG, item.planG)
            },
            {
                role: 'CQ interne',
                matcher: (item: any) => this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi)
            }
        ];

        return roles.map((role) => {
            const roleItems = items.filter((item) => {
                const due = this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee);

                if (!due) {
                    return false;
                }

                due.setHours(0, 0, 0, 0);

                return due >= today &&
                    due <= maxDate &&
                    !this._isFinalized(item) &&
                    this._norm(item.position) !== 'client' &&
                    role.matcher(item);
            });

            const pages = roleItems.reduce((sum, item) => sum + Number(item.page || 0), 0);

            return {
                position: role.role,
                dossiers: roleItems.length,
                pages,
                avgPages: roleItems.length ? this._round(pages / roleItems.length) : 0
            };
        });
    }

    private _buildAvgPagesByDeliveryDate(items: any[]): any[] {
        const map = new Map<string, {
            label: string;
            dossiers: number;
            pages: number;
            avgPages: number;
        }>();

        const minDate = this._getLastTwoMonthsStartDate();

        items.forEach((item) => {
            const date = this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee);

            if (!date || date < minDate) {
                return;
            }

            const label = this._dateKey(date);

            const current = map.get(label) || {
                label,
                dossiers: 0,
                pages: 0,
                avgPages: 0
            };

            current.dossiers += 1;
            current.pages += Number(item.page || 0);
            current.avgPages = this._round(current.pages / current.dossiers);

            map.set(label, current);
        });

        return Array.from(map.values())
            .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    private _buildAvgPagesByRole(items: any[]): any[] {
        const activeItems = items.filter((item) => {
            return !this._isFinalized(item) &&
                this._norm(item.position) !== 'client';
        });

        const roles = [
            {
                role: 'Rédaction',
                matcher: (item: any) => this._roleHasWork(item.redacteur, item.etatR, item.planR)
            },
            {
                role: 'Graphisme',
                matcher: (item: any) => this._roleHasWork(item.graphiste, item.etatG, item.planG)
            },
            {
                role: 'CQ interne',
                matcher: (item: any) => this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi)
            },
            {
                role: 'CQ client',
                matcher: (item: any) => this._roleHasWork(item.cqclient, item.etatCqc, item.planCqc)
            }
        ];

        return roles.map((role) => {
            const roleItems = activeItems.filter((item) => role.matcher(item));
            const pages = roleItems.reduce((sum, item) => sum + Number(item.page || 0), 0);

            return {
                role: role.role,
                dossiers: roleItems.length,
                avgPages: roleItems.length ? this._round(pages / roleItems.length) : 0
            };
        });
    }

    private _buildStatusPie(items: any[]): any[] {
        const map = new Map<string, number>();

        items.forEach((item) => {
            const statut = item.statut || 'Non défini';
            map.set(statut, (map.get(statut) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([statut, value]) => ({
                statut,
                value
            }))
            .filter((x) => x.value > 0)
            .sort((a, b) => b.value - a.value);
    }

    private _buildLateItems(items: any[]): any[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return items
            .filter((item) => {
                const due = this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee);

                if (!due || this._isFinalized(item)) {
                    return false;
                }

                if (this._norm(item.position) === 'client') {
                    return false;
                }

                due.setHours(0, 0, 0, 0);

                return due < today;
            })
            .map((item) => ({
                ...item,
                alertReason: 'Date prévue dépassée'
            }));
    }

    private _normalizeApiItem(item: any): any {
        const annee = Number(item.annee || new Date().getFullYear());

        const dateLivraisonPrevue = this._apiValue(item, [
            'dateLivraisonPrevue',
            'datePrevue',
            'deadline',
            'dateEcheance',
            'dateLivraisonClient'
        ]);

        const dateLivraison = this._apiValue(item, [
            'dateLivraison',
            'dateLivraisonIso',
            'dateLivraisonReelle'
        ]);

        const dateReception = this._apiValue(item, [
            'dateReception',
            'dateReceptionIso',
            'reception'
        ]);

        return {
            ...item,

            id: this._apiValue(item, ['id', 'idDossier'], ''),
            codeClient: this._apiValue(item, ['codeClient', 'code', 'dossier'], ''),
            client: this._apiValue(item, ['client', 'rs', 'raisonSociale', 'name', 'nom'], 'Client non défini'),

            position: this._cleanPositionLabel(this._apiValue(item, [
                'position',
                'postion',
                'planProd',
                'livraison'
            ], 'Non définie')),

            statut: this._apiValue(item, ['statut', 'status'], 'Non défini'),
            loiHamon: this._apiValue(item, ['loiHamon', 'loihamon', 'loi_hamon'], 'Non défini'),
            nature: this._apiValue(item, ['nature', 'typeNature'], 'Non défini'),

            page: this._toNumber(this._apiValue(item, ['page', 'pages', 'nbrPage', 'nbPages'], 0)),
            charge: this._toNumber(this._apiValue(item, ['charge', 'estimation'], 0)),

            dateLivraisonPrevue,
            dateLivraison,
            dateReception,

            dateLivraisonPrevueIso: this._toIsoDate(dateLivraisonPrevue, annee),
            dateLivraisonIso: this._toIsoDate(dateLivraison, annee),
            dateReceptionIso: this._toIsoDate(dateReception, annee),

            redacteur: this._apiValue(item, ['redacteur', 'rédacteur', 'teamR', 'userR'], ''),
            graphiste: this._apiValue(item, ['graphiste', 'teamG', 'userG'], ''),
            cqinterne: this._apiValue(item, ['cqinterne', 'cqInterne', 'teamCqi', 'userCqi'], ''),
            cqclient: this._apiValue(item, ['cqclient', 'cqClient', 'teamCqc', 'userCqc'], ''),

            teamR: this._apiValue(item, ['teamR'], ''),
            teamG: this._apiValue(item, ['teamG'], ''),

            etatR: this._apiValue(item, ['etatR', 'planR'], ''),
            etatG: this._apiValue(item, ['etatG', 'planG'], ''),
            etatCqi: this._apiValue(item, ['etatCqi', 'planCqi'], ''),
            etatCqc: this._apiValue(item, ['etatCqc', 'planCqc'], ''),

            planR: this._apiValue(item, ['planR'], ''),
            planG: this._apiValue(item, ['planG'], ''),
            planCqi: this._apiValue(item, ['planCqi'], ''),
            planCqc: this._apiValue(item, ['planCqc'], ''),

            annee
        };
    }

    private _buildOptions(): void {
        this.statutOptions = this._buildOptionList(this.allItems.map((item) => item.statut));
        this.positionOptions = this._buildOptionList(this.allItems.map((item) => item.position));
        this.loiHamonOptions = this._buildOptionList(this.allItems.map((item) => item.loiHamon));
        this.natureOptions = this._buildOptionList(this.allItems.map((item) => item.nature));
    }

    private _buildOptionList(values: any[]): string[] {
        const clean = Array.from(
            new Set(
                values
                    .map((x) => String(x || '').trim())
                    .filter((x) => x)
            )
        ).sort((a, b) => a.localeCompare(b));

        return ['Tous', ...clean];
    }

    private _getPlanningDate(item: any): Date | null {
        return (
            this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee) ||
            this._parseTriwebDate(item.dateReceptionIso, item.annee) ||
            this._parseTriwebDate(item.dateLivraisonIso, item.annee)
        );
    }

    private _getLastTwoMonthsStartDate(): Date {
        const today = new Date();

        return new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }

    private _matchesRole(item: any, role: string): boolean {
        const n = this._norm(role);

        if (n === 'redacteur' || n === 'rédacteur') {
            return this._roleHasWork(item.redacteur, item.etatR, item.planR);
        }

        if (n === 'graphiste') {
            return this._roleHasWork(item.graphiste, item.etatG, item.planG);
        }

        if (n === 'cq interne') {
            return this._roleHasWork(item.cqinterne, item.etatCqi, item.planCqi);
        }

        if (n === 'cq client') {
            return this._roleHasWork(item.cqclient, item.etatCqc, item.planCqc);
        }

        return false;
    }

    private _roleHasWork(actor: any, etat: any, plan: any): boolean {
        const actorName = this._norm(actor);
        const state = this._norm(etat || plan);

        if (!actorName && !state) {
            return false;
        }

        if (
            actorName.includes('non affecte') ||
            actorName.includes('non affecté') ||
            actorName.includes('en instance')
        ) {
            return false;
        }

        return true;
    }

    private _isFinalized(item: any): boolean {
        const values = [
            item.statut,
            item.etatR,
            item.etatG,
            item.etatCqi,
            item.etatCqc,
            item.planProd,
            item.livraison
        ];

        return values.some((value) => {
            const n = this._norm(value);

            return n.includes('finalise') ||
                n.includes('finalisé') ||
                n.includes('valide') ||
                n.includes('validé') ||
                n.includes('livre') ||
                n.includes('livré');
        });
    }

    private _hasRetourCq(item: any): boolean {
        const values = [
            item.statut,
            item.position,
            item.planR,
            item.planG,
            item.planCqi,
            item.planCqc,
            item.etatR,
            item.etatG,
            item.etatCqi,
            item.etatCqc
        ];

        return values.some((value) => {
            const n = this._norm(value);

            return n.includes('retour cq') ||
                n.includes('retour') ||
                n.includes('non conforme');
        });
    }

    private _cleanPositionLabel(value: any): string {
        const raw = String(value || '').trim();

        if (!raw) {
            return 'Non définie';
        }

        const n = this._norm(raw);

        if (n.includes('production')) {
            return 'Production';
        }

        if (n.includes('cq client')) {
            return 'CQ Client';
        }

        if (n.includes('cq interne')) {
            return 'CQ Interne';
        }

        if (n.includes('client')) {
            return 'Client';
        }

        if (n.includes('ftp')) {
            return 'FTP';
        }

        if (n.includes('archive')) {
            return 'Archive';
        }

        return raw;
    }

    private _toIsoDate(value: any, fallbackYear?: any): string {
        const date = this._parseTriwebDate(value, fallbackYear);

        if (!date) {
            return '';
        }

        return this._dateKey(date);
    }

    private _parseTriwebDate(value: any, fallbackYear?: any): Date | null {
        if (!value) {
            return null;
        }

        const raw = String(value).trim();

        if (!raw) {
            return null;
        }

        const year = Number(fallbackYear || new Date().getFullYear());

        const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

        if (iso) {
            const y = Number(iso[1]);
            const month = Number(iso[2]);
            const day = Number(iso[3]);
            const date = new Date(y, month - 1, day);

            return isNaN(date.getTime()) ? null : date;
        }

        const ddmm = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);

        if (ddmm) {
            const day = Number(ddmm[1]);
            const month = Number(ddmm[2]);
            const date = new Date(year, month - 1, day);

            return isNaN(date.getTime()) ? null : date;
        }

        const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);

        if (ddmmyyyy) {
            const day = Number(ddmmyyyy[1]);
            const month = Number(ddmmyyyy[2]);
            let y = Number(ddmmyyyy[3]);

            if (y < 100) {
                y += 2000;
            }

            const date = new Date(y, month - 1, day);

            return isNaN(date.getTime()) ? null : date;
        }

        return null;
    }

    private _dateKey(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
    }

    private _avg(values: number[]): number {
        const clean = values.filter((x) => !isNaN(x));

        if (!clean.length) {
            return 0;
        }

        return this._round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
    }

    private _round(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private _toNumber(value: any): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const parsed = Number(String(value).replace(',', '.'));

        return isNaN(parsed) ? 0 : parsed;
    }

    private _apiValue(item: any, fields: string[], defaultValue: any = ''): any {
        for (const field of fields) {
            if (item && item[field] !== null && item[field] !== undefined && String(item[field]).trim() !== '') {
                return item[field];
            }
        }

        return defaultValue;
    }

    private _norm(value: any): string {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
}