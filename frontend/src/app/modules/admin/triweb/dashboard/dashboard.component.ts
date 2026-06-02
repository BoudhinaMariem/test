import { Component, OnInit } from '@angular/core';
import { TriwebApiService } from '../triweb-api.service';

@Component({
    selector: 'app-triweb-dashboard',
    templateUrl: './dashboard.component.html'
})
export class TriwebDashboardComponent implements OnInit {
    title = 'Dashboard général';
    subtitle = 'Vue consolidée des opérations Triweb avec recherche, filtres et graphiques dynamiques.';

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

    rawItems: any[] = [];
    items: any[] = [];

    statutOptions: string[] = ['Tous'];
    positionOptions: string[] = ['Tous'];
    loiHamonOptions: string[] = ['Tous'];
    natureOptions: string[] = ['Tous'];
    teamOptions: string[] = ['Tous'];

    kpis: any[] = [];

    dailyProduction: any[] = [];
    positionPieData: any[] = [];
    teamMetrics: any[] = [];
    deliveryData: any[] = [];
    nonAffectedPositionData: any[] = [];
    redacteurAvailabilityData: any[] = [];
    graphisteAvailabilityData: any[] = [];

    operationalRateData: any[] = [];
    triwebPalette: string[] = [
        '#EA7862',
        '#A80B4D',
        '#777777',
        '#F7B47F',
        '#3F7EA1',
        '#53B89F',
        '#5B4BEA'
    ];

    constructor(private triwebApiService: TriwebApiService) {}

    ngOnInit(): void {
        this.refreshDashboard();
    }

    refreshDashboard(): void {
        this.loading = true;

        this.triwebApiService.getItems().subscribe({
            next: (res: any[]) => {
                this.rawItems = Array.isArray(res) ? res : [];
                this.items = this.rawItems.map((item) => this._normalizeApiItem(item));

                console.log('[Dashboard] dossiers API utilisés =', this.items.length);
                console.log('[Dashboard] colonnes API =', Object.keys(this.rawItems[0] || {}));

                this.apiLoaded = true;
                this.lastUpdate = new Date();

                this._buildOptions();
                this.applyFilters();

                this.loading = false;
            },
            error: (error) => {
                console.error('[Dashboard] erreur API items', error);

                this.rawItems = [];
                this.items = [];
                this.apiLoaded = false;

                this._buildOptions();
                this.applyFilters();

                this.loading = false;
            }
        });
    }
    workStateOrder: string[] = [
        'Validé',
        'En cours',
        'En pause',
        'Affecté',
        'Retour CQ'
    ];

    workStateColors: Record<string, string> = {
        'Validé': '#EA7862',
        'En cours': '#A80B4D',
        'En pause': '#777777',
        'Affecté': '#F7B47F',
        'Retour CQ': '#3F7EA1'
    };

    customizeWorkStatePoint = (pointInfo: any): any => {
        const label = pointInfo.argument;
        return {
            color: this.workStateColors[label] || '#999999'
        };
    };

    private _buildRoleStateData(items: any[], role: 'R' | 'G'): any[] {
        const productionItems = items.filter((item) => {
            return this._norm(item.position) === 'production';
        });

        const counters: Record<string, number> = {};

        productionItems.forEach((item) => {
            const rawStatus = role === 'R' ? item.etatR : item.etatG;
            const label = this._normalizeWorkState(rawStatus);

            if (!label) {
                return;
            }

            counters[label] = (counters[label] || 0) + 1;
        });

        return this.workStateOrder
            .map((label) => ({
                label,
                value: counters[label] || 0
            }))
            .filter((x) => x.value > 0);
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
        const searchNorm = this._norm(this.search);

        const filtered = this.items.filter((item) => {
            const searchable = this._norm([
                item.client,
                item.codeClient,
                item.statut,
                item.position,
                item.nature,
                item.loiHamon,
                item.teamR,
                item.teamG,
                item.redacteur,
                item.graphiste
            ].join(' '));

            if (searchNorm && !searchable.includes(searchNorm)) {
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

            if (this.selectedTeam !== 'Tous') {
                const teamR = item.teamR || '';
                const teamG = item.teamG || '';

                if (teamR !== this.selectedTeam && teamG !== this.selectedTeam) {
                    return false;
                }
            }

            const operationalDate = this._getBestOperationalDate(item);

            if (this.dateFrom) {
                const from = this._parseTriwebDate(this.dateFrom, item.annee);

                if (from && operationalDate && operationalDate < from) {
                    return false;
                }
            }

            if (this.dateTo) {
                const to = this._parseTriwebDate(this.dateTo, item.annee);

                if (to && operationalDate && operationalDate > to) {
                    return false;
                }
            }

            return true;
        });

        this._recalculateVisuals(filtered);
    }

    customizePieTooltip = (arg: any): any => {
        const value = arg.value || 0;
        const percent = arg.percent ? `${(arg.percent * 100).toFixed(1)}%` : '';

        return {
            text: `${arg.argumentText} : ${value} dossier(s)<br>${percent}`
        };
    };

    customizeNonAffectedTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText} : ${arg.valueText} dossier(s)<br>` +
                `Rédaction non affectée : ${data.redac || 0}<br>` +
                `Graphisme non affecté : ${data.graph || 0}<br>` +
                `R + G non affectés : ${data.both || 0}`
        };
    };

    private _normalizeApiItem(item: any): any {
        const dateLivraisonPrevue = this._apiValue(item, [
            'dateLivraisonPrevue',
            'datePrevue',
            'deadline',
            'dateEcheance'
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

        const annee = Number(item.annee || new Date().getFullYear());

        return {
            id: this._apiValue(item, ['id', 'idDossier'], ''),
            client: this._apiValue(item, ['rs', 'client', 'raisonSociale', 'name'], 'Client non défini'),
            codeClient: this._apiValue(item, ['codeClient', 'code'], ''),
            statut: this._apiValue(item, ['statut', 'status'], 'Non défini'),
            position: this._cleanPositionLabel(this._apiValue(item, ['postion', 'position'], 'Non défini')),
            loiHamon: this._apiValue(item, ['loiHamon', 'loi_type', 'typeProjet'], 'Non défini'),
            nature: this._apiValue(item, ['nature', 'typeProjet'], 'Non défini'),

            teamR: this._apiValue(item, ['teamR'], ''),
            teamG: this._apiValue(item, ['teamG'], ''),
            redacteur: this._apiValue(item, ['redacteur'], ''),
            graphiste: this._apiValue(item, ['graphiste'], ''),

            etatR: this._apiValue(item, ['etatR'], ''),
            etatG: this._apiValue(item, ['etatG'], ''),
            etatCqi: this._apiValue(item, ['etatCqi', 'etatCQI'], ''),
            etatCqc: this._apiValue(item, ['etatCqc', 'etatCQC'], ''),

            page: this._toNumber(this._apiValue(item, ['page', 'pages'], 0)),
            charge: this._toNumber(this._apiValue(item, ['charge', 'estimation'], 0)),
            totalHours: this._toNumber(this._apiValue(item, ['totalHours'], 0)),

            dureeRHours: this._toNumber(this._apiValue(item, ['dureeRHours'], 0)),
            dureeGHours: this._toNumber(this._apiValue(item, ['dureeGHours'], 0)),
            dureeCqiHours: this._toNumber(this._apiValue(item, ['dureeCqiHours'], 0)),
            dureeCqcHours: this._toNumber(this._apiValue(item, ['dureeCqcHours'], 0)),

            dateLivraisonPrevue,
            dateLivraison,
            dateReception,

            dateLivraisonPrevueIso: this._toIsoDate(dateLivraisonPrevue, annee),
            dateLivraisonIso: this._toIsoDate(dateLivraison, annee),
            dateReceptionIso: this._toIsoDate(dateReception, annee),

            annee
        };
    }

    private _buildOptions(): void {
        this.statutOptions = this._buildOptionList(this.items.map((x) => x.statut));
        this.positionOptions = this._buildOptionList(this.items.map((x) => x.position));
        this.loiHamonOptions = this._buildOptionList(this.items.map((x) => x.loiHamon));
        this.natureOptions = this._buildOptionList(this.items.map((x) => x.nature));

        const teams: string[] = [];

        this.items.forEach((x) => {
            if (x.teamR) {
                teams.push(x.teamR);
            }

            if (x.teamG) {
                teams.push(x.teamG);
            }
        });

        this.teamOptions = this._buildOptionList(teams);
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

    private _recalculateVisuals(items: any[]): void {
        this.kpis = this._buildKpis(items);

        this.dailyProduction = this._groupByDay(items);
        this.positionPieData = this._buildPositionPie(items);
        this.teamMetrics = this._buildTeamMetrics(items);
        this.deliveryData = this._groupPagesByDelivery(items);
        this.nonAffectedPositionData = this._buildNonAffectedByPosition(items);
        this.redacteurAvailabilityData = this._buildRoleStateData(items, 'R');
        this.graphisteAvailabilityData = this._buildRoleStateData(items, 'G');
        this.operationalRateData = this._buildOperationalRateData(items);
    }

    private _round(value: number): number {
        return Math.round(value * 100) / 100;
    }
    
    private _buildOperationalRateData(items: any[]): any[] {
        const total = items.length || 1;

        const productionItems = items.filter((item) => {
            return this._norm(item.position) === 'production';
        });

        const productionTotal = productionItems.length || 1;

        const finalized = items.filter((item) => this._isFinalized(item)).length;

        const affectedProduction = productionItems.filter((item) => {
            return this._norm(item.etatR).includes('affect') ||
                this._norm(item.etatG).includes('affect') ||
                this._norm(item.etatCqi).includes('affect') ||
                this._norm(item.etatCqc).includes('affect') ||
                this._norm(item.etatR).includes('cours') ||
                this._norm(item.etatG).includes('cours');
        }).length;

        const retourCq = items.filter((item) => this._hasRetourCq(item)).length;

        const nonAffectedProduction = productionItems.filter((item) => {
            return this._norm(item.statut).includes('cours') &&
                (
                    this._isTeamRNonAffecte(item.teamR) ||
                    this._isTeamGNonAffecte(item.teamG)
                );
        }).length;

        return [
            {
                label: 'Finalisés',
                value: this._round((finalized / total) * 100),
                count: finalized
            },
            {
                label: 'Affectés prod.',
                value: this._round((affectedProduction / productionTotal) * 100),
                count: affectedProduction
            },
            {
                label: 'Retours CQ',
                value: this._round((retourCq / total) * 100),
                count: retourCq
            },
            {
                label: 'Non affectés prod.',
                value: this._round((nonAffectedProduction / productionTotal) * 100),
                count: nonAffectedProduction
            }
        ];
    }

    customizeOperationalRateTooltip = (arg: any): any => {
        const data = arg.point?.data || {};

        return {
            text:
                `${arg.argumentText}<br>` +
                `Taux : ${arg.valueText}%<br>` +
                `Dossiers : ${data.count || 0}`
        };
    };

    private _buildKpis(items: any[]): any[] {
        const total = items.length;
        const finalized = items.filter((x) => this._isFinalized(x)).length;
        const productionAffected = items.filter((x) => {
            return this._norm(x.position) === 'production' &&
                (
                    this._norm(x.etatR).includes('affect') ||
                    this._norm(x.etatG).includes('affect') ||
                    this._norm(x.etatCqi).includes('affect') ||
                    this._norm(x.etatCqc).includes('affect')
                );
        }).length;

        const nonAffected = items.filter((x) => this._isNonAffectedByTeam(x)).length;
        const pagesToday = this._pagesDeliveredToday(items);

        const returnCq = items.filter((x) => this._hasRetourCq(x)).length;

        return [
            {
                title: 'Total dossiers',
                value: total,
                delta: 'Périmètre filtré',
                trend: 'neutral'
            },
            {
                title: 'Affectés production',
                value: productionAffected,
                delta: 'Position Production + état affecté',
                trend: 'up'
            },
            {
                title: 'Non affectés',
                value: nonAffected,
                delta: 'teamR non affecté ou teamG CDC',
                trend: nonAffected > 0 ? 'down' : 'up'
            },
            {
                title: 'Dossiers finalisés',
                value: finalized,
                delta: 'Livré / validé',
                trend: 'up'
            },
            {
                title: 'Pages livrées aujourd’hui',
                value: pagesToday,
                delta: 'Selon dateLivraison du jour',
                trend: 'neutral'
            },
            {
                title: 'Retours CQ',
                value: returnCq,
                delta: 'Retour CQ',
                trend: returnCq > 0 ? 'down' : 'up'
            }
        ];
    }

    private _getLastWeekStartDate(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(today);
        start.setDate(today.getDate() - 6);

        return start;
    }
    private _getLastTwoMonthsStartDate(): Date {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0 = janvier

        // Mois actuel + mois précédent, à partir du 1er jour du mois précédent
        return new Date(currentYear, currentMonth - 1, 1);
    }

    private _groupByDay(items: any[]): any[] {
        const map = new Map<string, any>();
        const minDate = this._getLastWeekStartDate();

        items.forEach((item) => {
            const productionDate =
                this._parseTriwebDate(item.dateReceptionIso, item.annee) ||
                this._parseTriwebDate(item.dateReception, item.annee);

            const deliveryDate =
                this._parseTriwebDate(item.dateLivraisonIso, item.annee) ||
                this._parseTriwebDate(item.dateLivraison, item.annee);

            const retourDate =
                this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee) ||
                this._parseTriwebDate(item.dateLivraisonPrevue, item.annee) ||
                productionDate;

            if (
                this._norm(item.position) === 'production' &&
                productionDate &&
                productionDate >= minDate
            ) {
                const key = this._dateKey(productionDate);

                const current = map.get(key) || {
                    periode: key,
                    production: 0,
                    livres: 0,
                    retours: 0
                };

                current.production += 1;
                map.set(key, current);
            }

            if (
                this._isFinalized(item) &&
                deliveryDate &&
                deliveryDate >= minDate
            ) {
                const key = this._dateKey(deliveryDate);

                const current = map.get(key) || {
                    periode: key,
                    production: 0,
                    livres: 0,
                    retours: 0
                };

                current.livres += 1;
                map.set(key, current);
            }

            if (
                this._hasRetourCq(item) &&
                retourDate &&
                retourDate >= minDate
            ) {
                const key = this._dateKey(retourDate);

                const current = map.get(key) || {
                    periode: key,
                    production: 0,
                    livres: 0,
                    retours: 0
                };

                current.retours += 1;
                map.set(key, current);
            }
        });

        return Array.from(map.values())
            .filter((x) => x.production > 0 || x.livres > 0 || x.retours > 0)
            .sort((a, b) => String(a.periode).localeCompare(String(b.periode)));
    }

    private _buildPositionPie(items: any[]): any[] {
        const map = new Map<string, number>();

        items.forEach((item) => {
            const position = this._cleanPositionLabel(item.position || 'Non défini');
            map.set(position, (map.get(position) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([position, value]) => ({ position, value }))
            .filter((x) => x.value > 0)
            .sort((a, b) => b.value - a.value);
    }

    private _buildTeamMetrics(items: any[]): any[] {
        const map = new Map<string, any>();

        items.forEach((item) => {
            const roles = [
                { equipe: 'Rédaction', active: !!item.teamR || !!item.redacteur },
                { equipe: 'Graphisme', active: !!item.teamG || !!item.graphiste },
                { equipe: 'CQ interne', active: !!item.etatCqi },
                { equipe: 'CQ client', active: !!item.etatCqc }
            ];

            roles.forEach((role) => {
                if (!role.active) {
                    return;
                }

                const current = map.get(role.equipe) || {
                    equipe: role.equipe,
                    dossiers: 0,
                    retours: 0
                };

                current.dossiers += 1;

                if (this._hasRetourCq(item)) {
                    current.retours += 1;
                }

                map.set(role.equipe, current);
            });
        });

        return Array.from(map.values());
    }

    private _groupPagesByDelivery(items: any[]): any[] {
        const map = new Map<string, any>();
        const minDate = this._getLastWeekStartDate();

        items.forEach((item) => {
            const date =
                this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee) ||
                this._parseTriwebDate(item.dateLivraisonPrevue, item.annee);

            if (!date || date < minDate) {
                return;
            }

            const label = this._dateKey(date);

            const current = map.get(label) || {
                label,
                pages: 0,
                dossiers: 0
            };

            current.pages += Number(item.page || 0);
            current.dossiers += 1;

            map.set(label, current);
        });

        return Array.from(map.values())
            .filter((x) => x.pages > 0)
            .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    private _buildNonAffectedByPosition(items: any[]): any[] {
        const result = {
            label: 'Production',
            redac: 0,
            graph: 0,
            both: 0,
            total: 0
        };

        items.forEach((item) => {
            const isProduction = this._norm(item.position) === 'production';
            const isEnCours = this._norm(item.statut).includes('cours');

            if (!isProduction || !isEnCours) {
                return;
            }

            const redacNonAffecte = this._isTeamRNonAffecte(item.teamR);
            const graphNonAffecte = this._isTeamGNonAffecte(item.teamG);

            if (!redacNonAffecte && !graphNonAffecte) {
                return;
            }

            result.total += 1;

            if (redacNonAffecte && graphNonAffecte) {
                result.both += 1;
            } else if (redacNonAffecte) {
                result.redac += 1;
            } else if (graphNonAffecte) {
                result.graph += 1;
            }
        });

        return result.total > 0 ? [result] : [];
    }

    

    private _normalizeWorkState(value: any): string {
        const n = this._norm(value);

        if (!n) {
            return '';
        }

        if (n.includes('retour')) {
            return 'Retour CQ';
        }

        if (n.includes('pause')) {
            return 'En pause';
        }

        if (n.includes('cours')) {
            return 'En cours';
        }

        if (n.includes('affect')) {
            return 'Affecté';
        }

        if (n.includes('valide')) {
            return 'Validé';
        }

        return '';
    }

    private _pagesDeliveredToday(items: any[]): number {
        const today = this._dateKey(new Date());

        return items
            .filter((item) => {
                const date =
                    this._parseTriwebDate(item.dateLivraisonIso, item.annee) ||
                    this._parseTriwebDate(item.dateLivraison, item.annee);

                return date && this._dateKey(date) === today && this._isFinalized(item);
            })
            .reduce((sum, item) => sum + Number(item.page || 0), 0);
    }

    private _isFinalized(item: any): boolean {
        const statut = this._norm(item.statut);

        return statut.includes('livre') || statut.includes('valide');
    }

    private _hasRetourCq(item: any): boolean {
        const values = [
            item.etatR,
            item.etatG,
            item.etatCqi,
            item.etatCqc,
            item.statut
        ].map((x) => this._norm(x));

        return values.some((value) => {
            return value.includes('retour cq');
        });
    }

    private _isNonAffectedByTeam(item: any): boolean {
        return this._isTeamRNonAffecte(item.teamR) || this._isTeamGNonAffecte(item.teamG);
    }

    private _isTeamRNonAffecte(teamR: any): boolean {
        const value = this._norm(teamR);

        return [
            'production : non affecte',
            'production: non affecte',
            'cq interne : non affecte',
            'cq interne: non affecte',
            'ftp : non affecte',
            'ftp: non affecte',
            'archive : non affecte',
            'archive: non affecte',
            'cq client : non affecte',
            'cq client: non affecte'
        ].includes(value);
    }

    private _isTeamGNonAffecte(teamG: any): boolean {
        const value = this._norm(teamG);

        return value === 'cdc - en cours' || value === 'cdc en cours';
    }

    private _getBestOperationalDate(item: any): Date | null {
        return (
            this._parseTriwebDate(item.dateReceptionIso, item.annee) ||
            this._parseTriwebDate(item.dateReception, item.annee) ||
            this._parseTriwebDate(item.dateLivraisonPrevueIso, item.annee) ||
            this._parseTriwebDate(item.dateLivraisonPrevue, item.annee) ||
            this._parseTriwebDate(item.dateLivraisonIso, item.annee) ||
            this._parseTriwebDate(item.dateLivraison, item.annee)
        );
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

    private _position(item: any): string {
        return item.position || item.postion || '';
    }

    private _cleanPositionLabel(value: any): string {
        const raw = String(value || '').trim();

        if (!raw) {
            return 'Non défini';
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

        if (n.includes('ftp')) {
            return 'FTP';
        }

        if (n.includes('archive')) {
            return 'Archive';
        }

        if (n.includes('client')) {
            return 'Client';
        }

        return raw;
    }

    private _apiValue(item: any, keys: string[], defaultValue: any = ''): any {
        for (const key of keys) {
            if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') {
                return item[key];
            }
        }

        return defaultValue;
    }

    private _toNumber(value: any): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const parsed = Number(String(value).replace(',', '.'));

        return isNaN(parsed) ? 0 : parsed;
    }

    private _norm(value: any): string {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}